/**
 * Clients API Endpoint
 * List and filter clients
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
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
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      isActive: true,
    };

    if (source) {
      where.source = source;
    }

    if (minRating || maxRating) {
      where.averageRating = {};
      if (minRating) where.averageRating.gte = parseFloat(minRating);
      if (maxRating) where.averageRating.lte = parseFloat(maxRating);
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { averageRating: 'desc' },
      }),
      prisma.client.count({ where }),
    ]);

    // Add trends to clients
    const clientsWithTrends = await Promise.all(
      clients.map(async (client) => {
        const trend = await analyzeTrend(client.id, 'averageRating', 30, 30);
        return {
          ...client,
          trend,
          daysSinceLastReview: daysSince(client.lastReviewDate),
        };
      })
    );

    return NextResponse.json({
      clients: clientsWithTrends,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch clients' },
      { status: 500 }
    );
  }
}
