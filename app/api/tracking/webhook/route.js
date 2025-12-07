import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { supabase } from '../../../../lib/supabase';

/**
 * Verify AfterShip webhook signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Signature from header
 * @returns {boolean} Whether signature is valid
 */
const verifySignature = (payload, signature) => {
  const secret = process.env.AFTERSHIP_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('AFTERSHIP_WEBHOOK_SECRET not configured, skipping verification');
    return true; // Allow in development
  }

  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('base64');

  return signature === expectedSignature;
};

/**
 * POST /api/tracking/webhook
 * Receive tracking updates from AfterShip
 */
export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('aftership-hmac-sha256');

    // Verify webhook signature
    if (!verifySignature(rawBody, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(rawBody);
    const { msg } = payload;

    if (!msg) {
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    const {
      id: aftershipId,
      tracking_number: trackingNumber,
      tag,
      subtag,
      checkpoints,
      expected_delivery: expectedDelivery
    } = msg;

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
      console.log(`No part found for tracking ${trackingNumber}`);
      return NextResponse.json({ success: true, message: 'No matching part' });
    }

    // Get last checkpoint info
    const lastCheckpoint = checkpoints?.[checkpoints.length - 1];

    // Update all matching parts
    for (const part of parts) {
      const updateData = {
        aftership_id: aftershipId,
        tracking_status: tag,
        tracking_substatus: subtag,
        tracking_location: lastCheckpoint?.location || lastCheckpoint?.city || null,
        tracking_eta: expectedDelivery || null,
        tracking_updated_at: new Date().toISOString(),
        tracking_checkpoints: checkpoints || []
      };

      // Auto-mark as delivered if AfterShip says delivered
      if (tag === 'Delivered' && !part.delivered) {
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
    message: 'AfterShip webhook endpoint is active'
  });
}
