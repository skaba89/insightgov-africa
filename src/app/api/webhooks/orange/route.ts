// =============================================================================
// InsightGov Africa - Orange Money Webhook
// Endpoint de callback pour les paiements Orange Money
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { orangeMoneyService } from '@/lib/payments';

// POST /api/webhooks/orange - Handle Orange Money callbacks
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const data = JSON.parse(payload);

    console.log('[Orange Money Webhook] Received:', JSON.stringify(data, null, 2));

    // Verify signature
    const signature = request.headers.get('x-orange-signature') || '';
    const isValid = orangeMoneyService.verifyWebhookSignature(payload, signature);

    if (!isValid) {
      console.error('[Orange Money Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Process the webhook
    await orangeMoneyService.handleWebhookCallback(data);

    // Return success response
    return NextResponse.json({ 
      received: true,
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    console.error('[Orange Money Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/webhooks/orange - Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'orange-money-webhook',
    timestamp: new Date().toISOString(),
  });
}
