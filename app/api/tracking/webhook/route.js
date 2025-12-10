import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

/**
 * Map Ship24 statusMilestone to our display format
 */
const normalizeStatusMilestone = (statusMilestone) => {
  const statusMap = {
    'pending': 'Pending',
    'info_received': 'InfoReceived',
    'in_transit': 'InTransit',
    'out_for_delivery': 'OutForDelivery',
    'attempt_fail': 'AttemptFail',
    'delivered': 'Delivered',
    'available_for_pickup': 'AvailableForPickup',
    'exception': 'Exception',
    'expired': 'Expired'
  };
  return statusMap[statusMilestone] || 'Pending';
};

/**
 * Verify Ship24 webhook authorization
 * Ship24 sends the webhook secret in the Authorization header
 * @param {Request} request - Incoming request
 * @returns {boolean} Whether authorization is valid
 */
const verifyAuthorization = (request) => {
  const secret = process.env.SHIP24_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('SHIP24_WEBHOOK_SECRET not configured, skipping verification');
    return true; // Allow in development
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return false;
  }

  // Ship24 sends the secret directly in the Authorization header
  return authHeader === secret || authHeader === `Bearer ${secret}`;
};

/**
 * HEAD /api/tracking/webhook
 * Ship24 probes the webhook endpoint with HEAD requests
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

/**
 * POST /api/tracking/webhook
 * Receive tracking updates from Ship24
 */
export async function POST(request) {
  try {
    // Verify webhook authorization
    if (!verifyAuthorization(request)) {
      console.error('Invalid webhook authorization');
      return NextResponse.json(
        { error: 'Invalid authorization' },
        { status: 401 }
      );
    }

    const payload = await request.json();

    // Ship24 webhook payload structure
    const { trackerId, trackingNumber, shipment, events } = payload;

    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'Invalid payload - missing trackingNumber' },
        { status: 400 }
      );
    }

    // Find the part by tracking number
    const { data: parts, error: findError } = await supabase
      .from('parts')
      .select('id, delivered')
      .eq('tracking', trackingNumber);

    if (findError) {
      console.error('Error finding part:', findError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    if (!parts || parts.length === 0) {
      // Part not found - might be tracking from another source
      return NextResponse.json({ success: true, message: 'No matching part' });
    }

    // Get status and last event info
    const statusMilestone = shipment?.statusMilestone || events?.[0]?.statusMilestone || 'pending';
    const lastEvent = events?.[0]; // Ship24 returns events in reverse chronological order
    const normalizedStatus = normalizeStatusMilestone(statusMilestone);

    // Update all matching parts
    for (const part of parts) {
      const updateData = {
        ship24_id: trackerId,
        tracking_status: normalizedStatus,
        tracking_substatus: lastEvent?.statusCode || null,
        tracking_location: lastEvent?.location?.city || lastEvent?.location?.country || null,
        tracking_eta: shipment?.delivery?.estimatedDeliveryDate || null,
        tracking_updated_at: new Date().toISOString(),
        tracking_checkpoints: (events || []).map(event => ({
          checkpoint_time: event.datetime,
          message: event.status,
          location: event.location?.city || event.location?.country,
          status: event.statusMilestone,
          statusCode: event.statusCode
        }))
      };

      // Auto-mark as delivered if Ship24 says delivered
      if (normalizedStatus === 'Delivered' && !part.delivered) {
        updateData.delivered = true;
      }

      const { error: updateError } = await supabase
        .from('parts')
        .update(updateData)
        .eq('id', part.id);

      if (updateError) {
        console.error(`Error updating part ${part.id}:`, updateError);
      }
    }

    return NextResponse.json({
      success: true,
      updated: parts.length
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tracking/webhook
 * Health check for webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Ship24 webhook endpoint is active'
  });
}
