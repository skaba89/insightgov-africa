// =============================================================================
// InsightGov Africa - MTN Money Webhook
// Endpoint de callback pour les paiements MTN Money
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { mtnMoneyService } from '@/lib/payments';

// POST /api/webhooks/mtn - Handle MTN Money callbacks
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const data = JSON.parse(payload);

    console.log('[MTN Money Webhook] Received:', JSON.stringify(data, null, 2));

    // Verify signature
    const signature = request.headers.get('x-mtn-signature') || '';
    const isValid = mtnMoneyService.verifyWebhookSignature(payload, signature);

    if (!isValid) {
      console.error('[MTN Money Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Process the webhook
    await mtnMoneyService.handleWebhookCallback(data);

    // Return success response
    return NextResponse.json({ 
      received: true,
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    console.error('[MTN Money Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/webhooks/mtn - Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'mtn-money-webhook',
    timestamp: new Date().toISOString(),
  });
}
