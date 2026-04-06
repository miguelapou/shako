import { NextResponse } from 'next/server';
import {
  syncPartTracking
} from '../../../../services/trackingService';
import { createServerClient } from '../../../../lib/supabaseServer';
import { shouldSkipShip24, getTrackingUrl } from '../../../../utils/trackingUtils';

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

    // Create authenticated Supabase client from request
    const supabase = createServerClient(request);

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

    // Skip URLs and Amazon tracking - return external link info
    if (shouldSkipShip24(part.tracking)) {
      return NextResponse.json({
        success: true,
        tracking: {
          tracking_status: 'External',
          tracking_url: getTrackingUrl(part.tracking) || part.tracking
        }
      });
    }

    // Sync with Ship24 and update database (pass authenticated client)
    const trackingData = await syncPartTracking(part, supabase);

    // Check if package was delivered and auto-update part status
    let isDelivered = part.delivered;
    if (trackingData?.tracking_status === 'Delivered' && !part.delivered) {
      await supabase
        .from('parts')
        .update({ delivered: true })
        .eq('id', partId);
      isDelivered = true;
    }

    // Sync all other parts sharing the same tracking number
    if (trackingData && part.tracking) {
      const { data: siblingParts } = await supabase
        .from('parts')
        .select('id, delivered')
        .eq('tracking', part.tracking)
        .neq('id', partId);

      if (siblingParts?.length > 0) {
        const { delivered: _delivered, ...trackingUpdate } = trackingData;
        await supabase
          .from('parts')
          .update(trackingUpdate)
          .eq('tracking', part.tracking)
          .neq('id', partId);

        if (trackingData.tracking_status === 'Delivered') {
          await supabase
            .from('parts')
            .update({ delivered: true })
            .eq('tracking', part.tracking)
            .neq('id', partId);
        }
      }
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

    // Handle rate limit or quota errors - return cached data if available
    const isQuota = error.message?.includes('quota_limit_reached');
    const isRateLimit = error.message?.includes('429') || error.message?.includes('rate limit');
    if (isQuota || isRateLimit) {
      const { id } = await params;
      const partId = parseInt(id, 10);

      // Create authenticated client for error handling
      const supabaseClient = createServerClient(request);

      // Get cached tracking data from database
      const { data: part } = await supabaseClient
        .from('parts')
        .select('tracking_status, tracking_location, tracking_checkpoints, tracking_updated_at, delivered')
        .eq('id', partId)
        .single();

      // Use Ship24-provided reset date if available, else fall back to 1st of next month
      const quotaParts = error.message?.split('quota_limit_reached|');
      const apiResetDate = quotaParts?.[1] ? new Date(quotaParts[1]) : null;
      const resetDate = (apiResetDate && !isNaN(apiResetDate)) ? apiResetDate : (() => {
        const d = new Date();
        d.setMonth(d.getMonth() + 1, 1);
        d.setHours(0, 0, 0, 0);
        return d;
      })();
      const resetStr = resetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

      const limitMessage = isQuota
        ? `Ship24 monthly quota reached. Resets ${resetStr}. Showing cached data.`
        : 'API rate limit reached. Showing cached data.';
      const limitError = isQuota
        ? `Ship24 monthly quota reached. Resets ${resetStr}. Upgrade your plan at dashboard.ship24.com.`
        : 'API rate limit reached. Please try again later.';

      if (part?.tracking_status) {
        return NextResponse.json({
          success: true,
          tracking: part,
          rateLimited: true,
          rateLimitMessage: limitMessage
        });
      }

      return NextResponse.json({
        success: false,
        error: limitError,
        rateLimited: true
      }, { status: 429 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch tracking' },
      { status: 500 }
    );
  }
}
