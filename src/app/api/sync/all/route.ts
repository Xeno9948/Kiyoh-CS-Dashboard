/**
 * Sync All API Endpoint
 * Triggers data sync from all review platforms
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { syncAll } from '@/lib/sync/syncService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if API tokens are configured
    if (!process.env.KIYOH_API_TOKEN && !process.env.KLANTENVERTELLEN_API_TOKEN) {
      return NextResponse.json(
        { error: 'API tokens not configured. Please set KIYOH_API_TOKEN or KLANTENVERTELLEN_API_TOKEN in Railway settings.' },
        { status: 400 }
      );
    }

    const { clientsProcessed, reviewsProcessed, errors } = await syncAll();

    return NextResponse.json({
      success: true, // Assuming success if tokens are present and syncAll is called
      clientsProcessed,
      reviewsProcessed,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}
