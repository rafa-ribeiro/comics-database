import axios from 'axios'
import dotenv from 'dotenv'
import { YouTubeSnippet, YouTubeCallback } from './types'
import { paramsToUrl } from '../utils'
dotenv.config()

interface PlaylistItemsOptions {
    /**
     * The callback function to be called after each page of playlist items is fetched.
     */
    callback?: YouTubeCallback
    /**
     * The published date and time (ISO 8601 format) to filter the playlist items.
     */
    publishedAfter?: string
    /**
     * The number of playlist items to fetch per page.
     */
    perPage?: number
}

/**
 * Fetches playlist items from YouTube API.
 * @param options - The options for fetching playlist items.
 * @returns A promise that resolves to an array of YouTubeSnippet objects.
 * @throws Error if the required environment variables are missing.
 */
export const fetchPlaylistItems = async (options: PlaylistItemsOptions): Promise<YouTubeSnippet[]> => {
    if(!process.env.YOUTUBE_API_KEY) {
        throw new Error('Missing YOUTUBE_API_KEY env variable');
    }
    if(!process.env.YOUTUBE_PLAYLIST_ID) {
        throw new Error('Missing YOUTUBE_PLAYLIST_ID env variable');
    }
    const { publishedAfter, perPage } = options
    const fetchPage = async (pageToken?: string): Promise<YouTubeSnippet[]> => {
        try {
            const url = paramsToUrl('https://www.googleapis.com/youtube/v3/playlistItems', { 
                part: 'snippet',
                playlistId: process.env.YOUTUBE_PLAYLIST_ID,
                key: process.env.YOUTUBE_API_KEY,
                pageToken,
                maxResults: perPage?.toString() || '50',
                publishedAfter
            });
    
            console.log(`Fetching page: ${url}`);
    
            const response = await axios.get(url);
            const snippets = response.data.items.map((item: Record<'snippet', YouTubeSnippet>) => item.snippet);
            const nextPageToken = response.data.nextPageToken;
    
            if (nextPageToken) {
                console.log(`Fetching next page: ${nextPageToken}`);
                await fetchPage(nextPageToken);
            }
            return snippets;
        } catch (error) {
            console.error('Error fetching page:', error);
            throw error; // Rejeita a promessa com o erro capturado
        }        
    }; 
    return await fetchPage();
}