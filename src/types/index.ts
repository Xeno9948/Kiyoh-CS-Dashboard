/**
 * Shared TypeScript Types
 */

export type ReviewSource = 'KIYOH' | 'KLANTENVERTELLEN';
export type SyncStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';
export type TrendDirection = 'up' | 'down' | 'stable';

export interface Client {
  id: string;
  externalId: string;
  name: string;
  source: ReviewSource;
  package?: string | null;
  features?: Record<string, any> | null;
  isActive: boolean;
  averageRating?: number | null;
  totalReviews: number;
  responseRate?: number | null;
  lastReviewDate?: Date | null;
  reviewsLast30Days: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  externalId: string;
  clientId: string;
  rating: number;
  comment?: string | null;
  reviewerName?: string | null;
  reviewDate: Date;
  hasResponse: boolean;
  responseText?: string | null;
  responseDate?: Date | null;
  source: ReviewSource;
  rawData?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientMetric {
  id: string;
  clientId: string;
  snapshotDate: Date;
  averageRating: number;
  totalReviews: number;
  newReviewsToday: number;
  responseRate: number;
  reviewsLast7Days: number;
  reviewsLast30Days: number;
}

export interface Settings {
  id: string;
  goodPerformerRating: number;
  badPerformerRating: number;
  minimumReviewsRequired: number;
  needsAttentionDays: number;
  lowResponseRateThreshold: number;
  topPerformersCount: number;
  bottomPerformersCount: number;
  updatedAt: Date;
}

export interface TrendAnalysis {
  direction: TrendDirection;
  changePercent: number;
  previousValue: number;
  currentValue: number;
}

export interface ClientWithTrend extends Client {
  trend?: TrendAnalysis;
  daysSinceLastReview?: number;
}

export interface OverviewData {
  bestPerformers: ClientWithTrend[];
  worstPerformers: ClientWithTrend[];
  needsAttention: ClientWithTrend[];
  totalClients: number;
  avgRating: number;
  totalReviews: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  averageRating: number;
  totalReviews: number;
  newReviews: number;
  responseRate: number;
}

export interface PeriodComparison {
  metric: string;
  currentPeriod: number;
  previousPeriod: number;
  change: number;
  changePercent: number;
  direction: TrendDirection;
}
