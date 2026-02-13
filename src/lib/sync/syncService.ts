/**
 * Sync Service
 * Orchestrates data sync from review platforms
 */

import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import { kiyohAPI, KiyohLocation, KiyohReview } from '../api/kiyoh';
import { klantenvertellenAPI, KlantenvertellenCompany, KlantenvertellenReview } from '../api/klantenvertellen';
import { updateClientMetrics, createMetricSnapshot } from './metricsCalculator';

export interface SyncResult {
  success: boolean;
  clientsProcessed: number;
  reviewsProcessed: number;
  errors: string[] | null | Prisma.JsonValue;
}

/**
 * Sync data from Kiyoh
 */
async function syncKiyoh(): Promise<{ clients: number; reviews: number; errors: string[] }> {
  console.log('[SyncService] Starting Kiyoh sync...');
  const errors: string[] = [];
  let clientsCount = 0;
  let reviewsCount = 0;

  try {
    // Fetch locations
    const locations = await kiyohAPI.fetchLocations();

    for (const location of locations) {
      console.log(`[SyncService] Processing Kiyoh location: ${location.locationId} - ${location.name}`);
      try {
        // Upsert client
        const client = await prisma.client.upsert({
          where: { externalId: `KIYOH_${location.locationId}` },
          update: {
            name: location.name,
            package: location.package,
            features: location.features,
          },
          create: {
            externalId: `KIYOH_${location.locationId}`,
            name: location.name,
            source: 'KIYOH',
            package: location.package,
            features: location.features,
          },
        });

        clientsCount++;

        // Fetch reviews for this location
        const reviews = await kiyohAPI.fetchReviewsForLocation(location.locationId);

        for (const review of reviews) {
          try {
            await prisma.review.upsert({
              where: { externalId: `KIYOH_${review.reviewId}` },
              update: {
                rating: review.rating,
                comment: review.comment,
                reviewerName: review.reviewerName,
                reviewDate: new Date(review.reviewDate),
                hasResponse: review.hasReaction || false,
                responseText: review.reactionText,
                responseDate: review.reactionDate ? new Date(review.reactionDate) : null,
                rawData: review as any,
              },
              create: {
                externalId: `KIYOH_${review.reviewId}`,
                clientId: client.id,
                rating: review.rating,
                comment: review.comment,
                reviewerName: review.reviewerName,
                reviewDate: new Date(review.reviewDate),
                hasResponse: review.hasReaction || false,
                responseText: review.reactionText,
                responseDate: review.reactionDate ? new Date(review.reactionDate) : null,
                source: 'KIYOH',
                rawData: review as any,
              },
            });

            reviewsCount++;
          } catch (error: any) {
            const msg = `Failed to sync Kiyoh review ${review.reviewId}: ${error.message}`;
            console.error(msg);
            errors.push(msg);
          }
        }

        // Update client metrics
        await updateClientMetrics(client.id);
        await createMetricSnapshot(client.id);

      } catch (error: any) {
        const msg = `Failed to sync Kiyoh location ${location.locationId}: ${error.message}`;
        console.error(msg);
        errors.push(msg);
      }
    }
  } catch (error: any) {
    const msg = `Failed to fetch Kiyoh locations: ${error.message}`;
    console.error(msg);
    errors.push(msg);
  }

  console.log(`[SyncService] Kiyoh sync complete. Clients: ${clientsCount}, Reviews: ${reviewsCount}, Errors: ${errors.length}`);
  return { clients: clientsCount, reviews: reviewsCount, errors };
}

/**
 * Sync data from Klantenvertellen
 */
async function syncKlantenvertellen(): Promise<{ clients: number; reviews: number; errors: string[] }> {
  console.log('[SyncService] Starting Klantenvertellen sync...');
  const errors: string[] = [];
  let clientsCount = 0;
  let reviewsCount = 0;

  try {
    // Fetch companies
    const companies = await klantenvertellenAPI.fetchCompanies();

    for (const company of companies) {
      console.log(`[SyncService] Processing Klantenvertellen company: ${company.companyId} - ${company.name}`);
      try {
        // Upsert client
        const client = await prisma.client.upsert({
          where: { externalId: `KLANTENVERTELLEN_${company.companyId}` },
          update: {
            name: company.name,
            package: company.package,
            features: company.features,
          },
          create: {
            externalId: `KLANTENVERTELLEN_${company.companyId}`,
            name: company.name,
            source: 'KLANTENVERTELLEN',
            package: company.package,
            features: company.features,
          },
        });

        clientsCount++;

        // Fetch reviews for this company
        const reviews = await klantenvertellenAPI.fetchReviewsForCompany(company.companyId);

        for (const review of reviews) {
          try {
            await prisma.review.upsert({
              where: { externalId: `KLANTENVERTELLEN_${review.reviewId}` },
              update: {
                rating: review.rating,
                comment: review.comment,
                reviewerName: review.reviewerName,
                reviewDate: new Date(review.reviewDate),
                hasResponse: review.hasReaction || false,
                responseText: review.reactionText,
                responseDate: review.reactionDate ? new Date(review.reactionDate) : null,
                rawData: review as any,
              },
              create: {
                externalId: `KLANTENVERTELLEN_${review.reviewId}`,
                clientId: client.id,
                rating: review.rating,
                comment: review.comment,
                reviewerName: review.reviewerName,
                reviewDate: new Date(review.reviewDate),
                hasResponse: review.hasReaction || false,
                responseText: review.reactionText,
                responseDate: review.reactionDate ? new Date(review.reactionDate) : null,
                source: 'KLANTENVERTELLEN',
                rawData: review as any,
              },
            });

            reviewsCount++;
          } catch (error: any) {
            const msg = `Failed to sync Klantenvertellen review ${review.reviewId}: ${error.message}`;
            console.error(msg);
            errors.push(msg);
          }
        }

        // Update client metrics
        await updateClientMetrics(client.id);
        await createMetricSnapshot(client.id);

      } catch (error: any) {
        const msg = `Failed to sync Klantenvertellen company ${company.companyId}: ${error.message}`;
        console.error(msg);
        errors.push(msg);
      }
    }
  } catch (error: any) {
    const msg = `Failed to fetch Klantenvertellen companies: ${error.message}`;
    console.error(msg);
    errors.push(msg);
  }

  console.log(`[SyncService] Klantenvertellen sync complete. Clients: ${clientsCount}, Reviews: ${reviewsCount}, Errors: ${errors.length}`);
  return { clients: clientsCount, reviews: reviewsCount, errors };
}

/**
 * Main sync function
 * Syncs data from all platforms
 */
export async function syncAll(): Promise<SyncResult> {
  // Create sync job
  const syncJob = await prisma.syncJob.create({
    data: {
      status: 'RUNNING',
    },
  });

  try {
    // Sync from both platforms
    const [kiyohResult, klantenvertellenResult] = await Promise.all([
      syncKiyoh(),
      syncKlantenvertellen(),
    ]);

    const totalClients = kiyohResult.clients + klantenvertellenResult.clients;
    const totalReviews = kiyohResult.reviews + klantenvertellenResult.reviews;
    const allErrors = [...kiyohResult.errors, ...klantenvertellenResult.errors];

    // Update sync job
    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: allErrors.length > 0 ? 'FAILED' : 'COMPLETED',
        completedAt: new Date(),
        clientsProcessed: totalClients,
        reviewsProcessed: totalReviews,
        errors: allErrors.length > 0 ? allErrors : Prisma.DbNull,
      },
    });

    return {
      success: allErrors.length === 0,
      clientsProcessed: totalClients,
      reviewsProcessed: totalReviews,
      errors: allErrors,
    };

  } catch (error: any) {
    // Mark sync as failed
    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errors: [error.message],
      },
    });

    return {
      success: false,
      clientsProcessed: 0,
      reviewsProcessed: 0,
      errors: [error.message],
    };
  }
}

/**
 * Get latest sync job status
 */
export async function getLatestSyncStatus() {
  return await prisma.syncJob.findFirst({
    orderBy: { startedAt: 'desc' },
  });
}
