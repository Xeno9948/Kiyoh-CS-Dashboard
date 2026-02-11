/**
 * Metrics Calculator
 * Calculates client metrics from review data
 */

import { prisma } from '../prisma';
import { daysAgo, daysSince } from '../utils/dateUtils';

export interface ClientMetrics {
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  lastReviewDate: Date | null;
  reviewsLast7Days: number;
  reviewsLast30Days: number;
  newReviewsToday: number;
}

/**
 * Calculate all metrics for a client
 */
export async function calculateClientMetrics(clientId: string): Promise<ClientMetrics> {
  const [
    reviews,
    reviewsLast7Days,
    reviewsLast30Days,
    reviewsToday,
  ] = await Promise.all([
    prisma.review.findMany({
      where: { clientId },
      orderBy: { reviewDate: 'desc' },
    }),
    prisma.review.count({
      where: {
        clientId,
        reviewDate: { gte: daysAgo(7) },
      },
    }),
    prisma.review.count({
      where: {
        clientId,
        reviewDate: { gte: daysAgo(30) },
      },
    }),
    prisma.review.count({
      where: {
        clientId,
        reviewDate: { gte: daysAgo(0) },
      },
    }),
  ]);

  // Calculate average rating
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
    : 0;

  // Calculate response rate
  const reviewsWithResponses = reviews.filter(r => r.hasResponse).length;
  const responseRate = totalReviews > 0
    ? reviewsWithResponses / totalReviews
    : 0;

  // Get last review date
  const lastReviewDate = reviews.length > 0 ? reviews[0].reviewDate : null;

  return {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalReviews,
    responseRate,
    lastReviewDate,
    reviewsLast7Days,
    reviewsLast30Days,
    newReviewsToday: reviewsToday,
  };
}

/**
 * Update client with calculated metrics
 */
export async function updateClientMetrics(clientId: string): Promise<void> {
  const metrics = await calculateClientMetrics(clientId);

  await prisma.client.update({
    where: { id: clientId },
    data: {
      averageRating: metrics.averageRating,
      totalReviews: metrics.totalReviews,
      responseRate: metrics.responseRate,
      lastReviewDate: metrics.lastReviewDate,
      reviewsLast30Days: metrics.reviewsLast30Days,
    },
  });
}

/**
 * Create a metric snapshot for time-series analysis
 */
export async function createMetricSnapshot(clientId: string): Promise<void> {
  const metrics = await calculateClientMetrics(clientId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upsert to avoid duplicate snapshots for the same day
  await prisma.clientMetric.upsert({
    where: {
      clientId_snapshotDate: {
        clientId,
        snapshotDate: today,
      },
    },
    update: {
      averageRating: metrics.averageRating,
      totalReviews: metrics.totalReviews,
      newReviewsToday: metrics.newReviewsToday,
      responseRate: metrics.responseRate,
      reviewsLast7Days: metrics.reviewsLast7Days,
      reviewsLast30Days: metrics.reviewsLast30Days,
    },
    create: {
      clientId,
      snapshotDate: today,
      averageRating: metrics.averageRating,
      totalReviews: metrics.totalReviews,
      newReviewsToday: metrics.newReviewsToday,
      responseRate: metrics.responseRate,
      reviewsLast7Days: metrics.reviewsLast7Days,
      reviewsLast30Days: metrics.reviewsLast30Days,
    },
  });
}

/**
 * Classify client based on performance thresholds
 */
export async function classifyClient(clientId: string): Promise<{
  isBestPerformer: boolean;
  isWorstPerformer: boolean;
  needsAttention: boolean;
}> {
  const settings = await prisma.settings.findFirst();

  if (!settings) {
    throw new Error('Settings not initialized');
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
  });

  if (!client) {
    throw new Error('Client not found');
  }

  const hasMinReviews = client.totalReviews >= settings.minimumReviewsRequired;
  const averageRating = client.averageRating || 0;

  return {
    isBestPerformer: hasMinReviews && averageRating >= settings.goodPerformerRating,
    isWorstPerformer: hasMinReviews && averageRating <= settings.badPerformerRating,
    needsAttention:
      daysSince(client.lastReviewDate) > settings.needsAttentionDays ||
      (client.responseRate || 0) < settings.lowResponseRateThreshold,
  };
}

/**
 * Batch update metrics for all clients
 */
export async function updateAllClientMetrics(): Promise<number> {
  const clients = await prisma.client.findMany({
    where: { isActive: true },
    select: { id: true },
  });

  let updated = 0;

  for (const client of clients) {
    try {
      await updateClientMetrics(client.id);
      await createMetricSnapshot(client.id);
      updated++;
    } catch (error) {
      console.error(`Failed to update metrics for client ${client.id}:`, error);
    }
  }

  return updated;
}
