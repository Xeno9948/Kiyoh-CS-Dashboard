/**
 * Klantenvertellen API Client
 * Handles fetching companies and reviews from Klantenvertellen
 * API Documentation: https://api.klantenvertellen.nl/v1/doc
 */

import axios, { AxiosInstance } from 'axios';
import { globalRateLimiter } from './rateLimiter';

const KLANTENVERTELLEN_API_BASE = 'https://api.klantenvertellen.nl/v1';

export interface KlantenvertellenCompany {
  companyId: number;
  name: string;
  averageRating: number;
  reviewCount: number;
  package?: string;
  features?: Record<string, any>;
}

export interface KlantenvertellenReview {
  reviewId: number;
  companyId: number;
  rating: number;
  comment?: string;
  reviewerName?: string;
  reviewDate: string;
  hasReaction?: boolean;
  reactionText?: string;
  reactionDate?: string;
}

export class KlantenvertellenAPI {
  private client: AxiosInstance | null = null;

  constructor(private apiToken?: string) { }

  private getClient(): AxiosInstance {
    if (this.client) return this.client;

    const token = this.apiToken || process.env.KLANTENVERTELLEN_API_TOKEN;

    if (!token) {
      throw new Error('KLANTENVERTELLEN_API_TOKEN is not configured');
    }

    this.client = axios.create({
      baseURL: KLANTENVERTELLEN_API_BASE,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    return this.client;
  }

  /**
   * Fetch all companies (paginated)
   */
  async fetchCompanies(): Promise<KlantenvertellenCompany[]> {
    console.log('[KlantenvertellenAPI] Fetching companies...');
    await globalRateLimiter.acquire();

    try {
      const response = await this.getClient().get('/companies', {
        params: {
          limit: 100,
        },
      });

      const companies = response.data.companies || [];
      console.log(`[KlantenvertellenAPI] Fetched ${companies.length} companies`);
      return companies;
    } catch (error: any) {
      console.error('Error fetching Klantenvertellen companies:', error.message);
      if (error.response) {
        console.error('[KlantenvertellenAPI] Error response:', JSON.stringify(error.response.data));
      }
      throw error;
    }
  }

  /**
   * Fetch reviews for a specific company
   */
  async fetchReviewsForCompany(companyId: number, since?: Date): Promise<KlantenvertellenReview[]> {
    console.log(`[KlantenvertellenAPI] Fetching reviews for company ${companyId}...`);
    await globalRateLimiter.acquire();

    try {
      const params: any = {
        companyId,
        limit: 100,
      };

      if (since) {
        params.since = since.toISOString();
        console.log(`[KlantenvertellenAPI] Filtering reviews since ${params.since}`);
      }

      const response = await this.getClient().get('/reviews', {
        params,
      });

      const reviews = response.data.reviews || [];
      console.log(`[KlantenvertellenAPI] Fetched ${reviews.length} reviews for company ${companyId}`);
      return reviews;
    } catch (error: any) {
      console.error(`Error fetching Klantenvertellen reviews for company ${companyId}:`, error.message);
      if (error.response) {
        console.error('[KlantenvertellenAPI] Error response:', JSON.stringify(error.response.data));
      }
      throw error;
    }
  }

  /**
   * Fetch all reviews across all companies
   */
  async fetchAllReviews(since?: Date): Promise<KlantenvertellenReview[]> {
    console.log('[KlantenvertellenAPI] Fetching all reviews...');
    const companies = await this.fetchCompanies();
    const allReviews: KlantenvertellenReview[] = [];

    for (const company of companies) {
      try {
        const reviews = await this.fetchReviewsForCompany(company.companyId, since);
        allReviews.push(...reviews);
      } catch (error) {
        console.error(`Failed to fetch reviews for company ${company.companyId}`);
        // Continue with other companies
      }
    }

    console.log(`[KlantenvertellenAPI] Total reviews fetched: ${allReviews.length}`);
    return allReviews;
  }

  /**
   * Get company details by ID
   */
  async getCompany(companyId: number): Promise<KlantenvertellenCompany | null> {
    await globalRateLimiter.acquire();

    try {
      const response = await this.getClient().get(`/companies/${companyId}`);
      return response.data.company || null;
    } catch (error: any) {
      console.error(`Error fetching Klantenvertellen company ${companyId}:`, error.message);
      return null;
    }
  }
}

// Singleton instance
export const klantenvertellenAPI = new KlantenvertellenAPI();
