import { NextResponse } from 'next/server';
import {
  syncPartTracking
} from '../../../../services/trackingService';
import { supabase } from '../../../../lib/supabase';

/**
 * GET /api/tracking/[id]
 * Get and refresh tracking status for a specific part
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const partId = parseInt(id, 10);

    if (isNaN(partId)) {
      return NextResponse.json(
        { error: 'Invalid part ID' },
        { status: 400 }
      );
    }

    // Get the part from database
    const { data: part, error } = await supabase
      .from('parts')
      .select('*')
      .eq('id', partId)
      .single();

    if (error || !part) {
      return NextResponse.json(
        { error: 'Part not found' },
        { status: 404 }
      );
    }

    if (!part.tracking) {
      return NextResponse.json(
        { error: 'Part has no tracking number' },
        { status: 400 }
      );
    }

    // Skip URL tracking
    if (part.tracking.startsWith('http')) {
      return NextResponse.json({
        success: true,
        tracking: {
          tracking_status: 'External',
          tracking_url: part.tracking
        }
      });
    }

    // Sync with Ship24 and update database
    const trackingData = await syncPartTracking(part);

    // Check if package was delivered and auto-update part status
    let isDelivered = part.delivered;
    if (trackingData?.tracking_status === 'Delivered' && !part.delivered) {
      await supabase
        .from('parts')
        .update({ delivered: true })
        .eq('id', partId);
      isDelivered = true;
    }

    return NextResponse.json({
      success: true,
      tracking: {
        ...trackingData,
        delivered: isDelivered
      }
    });
  } catch (error) {
    console.error('Error fetching tracking:', error);

    // Handle rate limit error - return cached data if available
    if (error.message?.includes('429') || error.message?.includes('rate limit')) {
      const { id } = await params;
      const partId = parseInt(id, 10);

      // Get cached tracking data from database
      const { data: part } = await supabase
        .from('parts')
        .select('tracking_status, tracking_carrier, tracking_location, tracking_checkpoints, tracking_updated_at, delivered')
        .eq('id', partId)
        .single();

      if (part?.tracking_status) {
        return NextResponse.json({
          success: true,
          tracking: part,
          rateLimited: true,
          rateLimitMessage: 'API rate limit reached. Showing cached data.'
        });
      }

      return NextResponse.json({
        success: false,
        error: 'API rate limit reached. Please try again later.',
        rateLimited: true
      }, { status: 429 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch tracking' },
      { status: 500 }
    );
  }
}
