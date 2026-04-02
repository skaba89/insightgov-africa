// =============================================================================
// InsightGov Africa - SMS Send API Route
// =============================================================================
// POST /api/notifications/sms/send - Send SMS notification
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { notificationService, SendSMSOptions } from '@/lib/notification-service';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

// Validation schema
const smsSendSchema = z.object({
  phone: z.string().min(8, 'Numéro de téléphone inval'),
  message: z.string().min(1, 'Message requis').max(1530, 'Message trop long'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  scheduledAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Rate limiter for SMS
const smsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 SMS per minute per user
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Check rate limit
    const rateLimitResult = await smsRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = smsSendSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Données invalides',
          details: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { phone, message, priority, scheduledAt, metadata } = validation.data;

    // Send SMS
    const result = await notificationService.sendSMS(phone, message, {
      priority: priority as SendSMSOptions['priority'],
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      metadata,
      userId: session.user.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      cost: result.cost,
    });
  } catch (error) {
    console.error('[API] SMS send error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
