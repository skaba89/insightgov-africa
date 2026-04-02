// =============================================================================
// InsightGov Africa - OTP API Route
// =============================================================================
// POST /api/notifications/otp - Send OTP code
// GET /api/notifications/otp - Verify OTP code
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notification-service';
import { getSession } from '@/lib/auth';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

// Validation schemas
const otpSendSchema = z.object({
  phone: z.string().min(8, 'Numéro de téléphone inval'),
  type: z.enum(['verification', 'transaction', 'login', 'password_reset']).default('verification'),
  language: z.enum(['fr', 'en']).optional(),
});

const otpVerifySchema = z.object({
  phone: z.string().min(8, 'Numéro de téléphone inval'),
  code: z.string().length(6, 'Le code OTP doit contenir 6 chiffres'),
});

// Rate limiter for OTP
const otpRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // 3 OTP requests per minute per IP
});

// =============================================================================
// POST - Send OTP
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResult = await otpRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = otpSendSchema.safeParse(body);

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

    const { phone, type, language } = validation.data;

    // Send OTP
    const result = await notificationService.sendOTP(phone, type, language);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // In development, return the code for testing
    const responseData: Record<string, unknown> = {
      success: true,
      message: 'Code OTP envoyé avec succès',
    };

    if (process.env.NODE_ENV === 'development') {
      responseData.code = result.code;
      responseData.note = 'Code visible en développement uniquement';
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[API] OTP send error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Verify OTP
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    // Check authentication (optional - can verify OTP without auth)
    const session = await getSession();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone');
    const code = searchParams.get('code');

    // Validate
    const validation = otpVerifySchema.safeParse({ phone, code });

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

    // Verify OTP
    const result = await notificationService.verifyOTP(
      validation.data.phone,
      validation.data.code
    );

    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: 'Code OTP vérifié avec succès',
      userId: session?.user?.id,
    });
  } catch (error) {
    console.error('[API] OTP verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
