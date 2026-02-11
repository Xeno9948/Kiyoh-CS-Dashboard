/**
 * Dashboard Overview API Endpoint
 * Returns best performers, worst performers, and clients needing attention
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { analyzeTrend } from '@/lib/utils/trendAnalyzer';
import { daysSince } from '@/lib/utils/dateUtils';

export async function GET(request: Request) {
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get settings
    const settings = await prisma.settings.findFirst();

    if (!settings) {
      return NextResponse.json(
        { error: 'Settings not initialized' },
        { status: 500 }
      );
    }

    // Get best performers
    const bestPerformers = await prisma.client.findMany({
      where: {
        isActive: true,
        totalReviews: { gte: settings.minimumReviewsRequired },
        averageRating: { gte: settings.goodPerformerRating },
      },
      orderBy: { averageRating: 'desc' },
      take: settings.topPerformersCount,
    });

    // Get worst performers
    const worstPerformers = await prisma.client.findMany({
      where: {
        isActive: true,
        totalReviews: { gte: settings.minimumReviewsRequired },
        averageRating: { lte: settings.badPerformerRating },
      },
      orderBy: { averageRating: 'asc' },
      take: settings.bottomPerformersCount,
    });

    // Get clients needing attention
    const needsAttentionDate = new Date();
    needsAttentionDate.setDate(needsAttentionDate.getDate() - settings.needsAttentionDays);

    const needsAttention = await prisma.client.findMany({
      where: {
        isActive: true,
        OR: [
          { lastReviewDate: { lte: needsAttentionDate } },
          { lastReviewDate: null },
          { responseRate: { lte: settings.lowResponseRateThreshold } },
        ],
      },
      orderBy: { lastReviewDate: 'asc' },
      take: 10,
    });

    // Add trends
    const [bestWithTrends, worstWithTrends, needsAttentionWithTrends] = await Promise.all([
      Promise.all(bestPerformers.map(async (client) => ({
        ...client,
        trend: await analyzeTrend(client.id, 'averageRating', 30, 30),
        daysSinceLastReview: daysSince(client.lastReviewDate),
      }))),
      Promise.all(worstPerformers.map(async (client) => ({
        ...client,
        trend: await analyzeTrend(client.id, 'averageRating', 30, 30),
        daysSinceLastReview: daysSince(client.lastReviewDate),
      }))),
      Promise.all(needsAttention.map(async (client) => ({
        ...client,
        trend: await analyzeTrend(client.id, 'averageRating', 30, 30),
        daysSinceLastReview: daysSince(client.lastReviewDate),
      }))),
    ]);

    // Calculate overall stats
    const stats = await prisma.client.aggregate({
      where: { isActive: true },
      _count: true,
      _avg: { averageRating: true },
    });

    const totalReviews = await prisma.review.count();

    return NextResponse.json({
      bestPerformers: bestWithTrends,
      worstPerformers: worstWithTrends,
      needsAttention: needsAttentionWithTrends,
      totalClients: stats._count,
      avgRating: stats._avg.averageRating || 0,
      totalReviews,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch overview' },
      { status: 500 }
    );
  }
}
