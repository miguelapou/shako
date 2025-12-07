import { NextResponse } from 'next/server';
import {
  createAfterShipTracking,
  normalizeTrackingData,
  updatePartTracking,
  refreshAllActiveTrackings
} from '../../../services/trackingService';
import { supabase } from '../../../lib/supabase';

/**
 * POST /api/tracking
 * Create a new tracking for a part
 * Body: { partId, trackingNumber, carrier?, title? }
 */
export async function POST(request) {
  try {
    const { partId, trackingNumber, carrier, title } = await request.json();

    if (!partId || !trackingNumber) {
      return NextResponse.json(
        { error: 'partId and trackingNumber are required' },
        { status: 400 }
      );
    }

    // Skip URLs - they don't need API tracking
    if (trackingNumber.startsWith('http')) {
      return NextResponse.json(
        { error: 'URL tracking links are not supported for API tracking' },
        { status: 400 }
      );
    }

    // Create tracking in AfterShip
    const tracking = await createAfterShipTracking(trackingNumber, carrier, title);

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
