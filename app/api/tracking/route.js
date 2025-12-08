import { NextResponse } from 'next/server';
import {
  createShip24Tracking,
  normalizeTrackingData,
  updatePartTracking,
  refreshAllActiveTrackings
} from '../../../services/trackingService';
import { supabase } from '../../../lib/supabase';
import { shouldSkipShip24 } from '../../../utils/trackingUtils';

/**
 * POST /api/tracking
 * Create a new tracking for a part
 * Body: { partId, trackingNumber, title? }
 */
export async function POST(request) {
  try {
    const { partId, trackingNumber, title } = await request.json();

    if (!partId || !trackingNumber) {
      return NextResponse.json(
        { error: 'partId and trackingNumber are required' },
        { status: 400 }
      );
    }

    // Skip URLs and Amazon tracking - they don't need Ship24 API
    if (shouldSkipShip24(trackingNumber)) {
      return NextResponse.json(
        { error: 'This tracking type is not supported for API tracking' },
        { status: 400 }
      );
    }

    // Create tracking in Ship24
    const tracking = await createShip24Tracking(trackingNumber, title);

    // Normalize and save to our database
    const normalizedData = normalizeTrackingData(tracking);
    await updatePartTracking(partId, normalizedData);

    return NextResponse.json({
      success: true,
      tracking: normalizedData
    });
  } catch (error) {
    console.error('Error creating tracking:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create tracking' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tracking?userId=xxx
 * Refresh all active trackings for a user
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const results = await refreshAllActiveTrackings(userId);

    return NextResponse.json({
      success: true,
      updated: results.length,
      trackings: results
    });
  } catch (error) {
    console.error('Error refreshing trackings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to refresh trackings' },
      { status: 500 }
    );
  }
}
