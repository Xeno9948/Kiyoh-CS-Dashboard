/**
 * Trend Analysis Utilities
 * Analyzes time-series data to calculate trends and changes
 */

import { prisma } from '../prisma';
import { daysAgo } from './dateUtils';
import { TrendAnalysis, TrendDirection } from '@/types';

/**
 * Analyze trend for a specific client and metric
 */
export async function analyzeTrend(
  clientId: string,
  metric: 'averageRating' | 'totalReviews',
  currentPeriodDays: number = 30,
  previousPeriodDays: number = 30
): Promise<TrendAnalysis> {
  const now = new Date();
  const currentStart = daysAgo(currentPeriodDays);
  const previousStart = daysAgo(currentPeriodDays + previousPeriodDays);
  const previousEnd = currentStart;

  // Get current period metrics
  const currentMetrics = await prisma.clientMetric.findFirst({
    where: {
      clientId,
      snapshotDate: { gte: currentStart, lte: now },
    },
    orderBy: { snapshotDate: 'desc' },
  });

  // Get previous period metrics
  const previousMetrics = await prisma.clientMetric.findFirst({
    where: {
      clientId,
      snapshotDate: { gte: previousStart, lt: previousEnd },
    },
    orderBy: { snapshotDate: 'desc' },
  });

  const currentValue = currentMetrics?.[metric] || 0;
  const previousValue = previousMetrics?.[metric] || 0;

  // Calculate change
  const change = currentValue - previousValue;
  const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

  // Determine direction
  let direction: TrendDirection = 'stable';
  const threshold = metric === 'averageRating' ? 0.1 : 2; // Different thresholds for different metrics

  if (Math.abs(changePercent) < threshold) {
    direction = 'stable';
  } else if (change > 0) {
    direction = 'up';
  } else {
    direction = 'down';
  }

  return {
    direction,
    changePercent: Math.abs(changePercent),
    previousValue,
    currentValue,
  };
}

/**
 * Calculate rating velocity (reviews per day)
 */
export async function calculateReviewVelocity(
  clientId: string,
  days: number = 30
): Promise<number> {
  const since = daysAgo(days);

  const count = await prisma.review.count({
    where: {
      clientId,
      reviewDate: { gte: since },
    },
  });

  return count / days;
}

/**
 * Compare metrics between two time periods
 */
export async function comparePeriods(
  clientId: string,
  currentPeriodDays: number = 30,
  previousPeriodDays: number = 30
): Promise<{
  rating: TrendAnalysis;
  reviews: TrendAnalysis;
  velocity: { current: number; previous: number };
}> {
  const [ratingTrend, reviewsTrend] = await Promise.all([
    analyzeTrend(clientId, 'averageRating', currentPeriodDays, previousPeriodDays),
    analyzeTrend(clientId, 'totalReviews', currentPeriodDays, previousPeriodDays),
  ]);

  const currentVelocity = await calculateReviewVelocity(clientId, currentPeriodDays);
  const previousEnd = daysAgo(currentPeriodDays);
  const previousStart = daysAgo(currentPeriodDays + previousPeriodDays);

  const previousReviewCount = await prisma.review.count({
    where: {
      clientId,
      reviewDate: { gte: previousStart, lt: previousEnd },
    },
  });

  const previousVelocity = previousReviewCount / previousPeriodDays;

  return {
    rating: ratingTrend,
    reviews: reviewsTrend,
    velocity: {
      current: currentVelocity,
      previous: previousVelocity,
    },
  };
}

/**
 * Get trend direction symbol
 */
export function getTrendSymbol(direction: TrendDirection): string {
  switch (direction) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    case 'stable':
      return '→';
  }
}

/**
 * Get trend color
 */
export function getTrendColor(direction: TrendDirection, metric: 'rating' | 'reviews' = 'rating'): string {
  if (metric === 'rating') {
    return direction === 'up' ? 'success' : direction === 'down' ? 'error' : 'default';
  } else {
    return direction === 'up' ? 'success' : direction === 'down' ? 'warning' : 'default';
  }
}
