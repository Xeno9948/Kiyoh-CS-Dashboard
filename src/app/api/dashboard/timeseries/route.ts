/**
 * Time Series API Endpoint
 * Returns historical metrics for trend analysis
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getDateRange } from '@/lib/utils/dateUtils';
import { format } from 'date-fns';

export async function GET(request: Request) {
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const period = (searchParams.get('period') || '30d') as '7d' | '30d' | '90d';

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    const { start, end } = getDateRange(period);

    const metrics = await prisma.clientMetric.findMany({
      where: {
        clientId,
        snapshotDate: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { snapshotDate: 'asc' },
    });

    // Format for charts
    const timeSeriesData = metrics.map(metric => ({
      date: format(metric.snapshotDate, 'MMM d'),
      averageRating: metric.averageRating,
      totalReviews: metric.totalReviews,
      newReviews: metric.newReviewsToday,
      responseRate: metric.responseRate * 100, // Convert to percentage
    }));

    return NextResponse.json({
      data: timeSeriesData,
      period,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch time series data' },
      { status: 500 }
    );
  }
}
