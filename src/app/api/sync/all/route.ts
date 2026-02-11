/**
 * Sync All API Endpoint
 * Triggers data sync from all review platforms
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { syncAll } from '@/lib/sync/syncService';

export async function POST(request: Request) {
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncAll();

    return NextResponse.json({
      success: result.success,
      clientsProcessed: result.clientsProcessed,
      reviewsProcessed: result.reviewsProcessed,
      errors: result.errors,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Sync failed' },
      { status: 500 }
    );
  }
}
