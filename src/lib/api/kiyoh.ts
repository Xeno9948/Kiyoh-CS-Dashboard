/**
 * Kiyoh API Client
 * Handles fetching locations and reviews from Kiyoh
 * API Documentation: https://api.kiyoh.com/v1/doc
 */

import axios, { AxiosInstance } from 'axios';
import { globalRateLimiter } from './rateLimiter';

const KIYOH_API_BASE = 'https://api.kiyoh.com/v1';

export interface KiyohLocation {
  locationId: number;
  name: string;
  averageRating: number;
  reviewCount: number;
  package?: string;
  features?: Record<string, any>;
}

export interface KiyohReview {
  reviewId: number;
  locationId: number;
  rating: number;
  comment?: string;
  reviewerName?: string;
  reviewDate: string;
  hasReaction?: boolean;
  reactionText?: string;
  reactionDate?: string;
}

export class KiyohAPI {
  private client: AxiosInstance;

  constructor(apiToken?: string) {
    const token = apiToken || process.env.KIYOH_API_TOKEN;

    if (!token) {
      throw new Error('KIYOH_API_TOKEN is not configured');
    }

    this.client = axios.create({
      baseURL: KIYOH_API_BASE,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Fetch all locations (paginated)
   */
  async fetchLocations(): Promise<KiyohLocation[]> {
    await globalRateLimiter.acquire();

    try {
      const response = await this.client.get('/locations', {
        params: {
          limit: 100,
        },
      });

      return response.data.locations || [];
    } catch (error: any) {
      console.error('Error fetching Kiyoh locations:', error.message);
      throw error;
    }
  }

  /**
   * Fetch reviews for a specific location
   */
  async fetchReviewsForLocation(locationId: number, since?: Date): Promise<KiyohReview[]> {
    await globalRateLimiter.acquire();

    try {
      const params: any = {
        locationId,
        limit: 100,
      };

      if (since) {
        params.since = since.toISOString();
      }

      const response = await this.client.get('/reviews', {
        params,
      });

      return response.data.reviews || [];
    } catch (error: any) {
      console.error(`Error fetching Kiyoh reviews for location ${locationId}:`, error.message);
      throw error;
    }
  }

  /**
   * Fetch all reviews across all locations
   */
  async fetchAllReviews(since?: Date): Promise<KiyohReview[]> {
    const locations = await this.fetchLocations();
    const allReviews: KiyohReview[] = [];

    for (const location of locations) {
      try {
        const reviews = await this.fetchReviewsForLocation(location.locationId, since);
        allReviews.push(...reviews);
      } catch (error) {
        console.error(`Failed to fetch reviews for location ${location.locationId}`);
        // Continue with other locations
      }
    }

    return allReviews;
  }

  /**
   * Get location details by ID
   */
  async getLocation(locationId: number): Promise<KiyohLocation | null> {
    await globalRateLimiter.acquire();

    try {
      const response = await this.client.get(`/locations/${locationId}`);
      return response.data.location || null;
    } catch (error: any) {
      console.error(`Error fetching Kiyoh location ${locationId}:`, error.message);
      return null;
    }
  }
}

// Singleton instance
export const kiyohAPI = new KiyohAPI();
