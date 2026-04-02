// =============================================================================
// InsightGov Africa - KYC Submit API Route
// =============================================================================
// POST /api/kyc/submit - Submit KYC documents for verification
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { kycService, KYCDocument, KYCLevel } from '@/lib/kyc-service';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

// Validation schema
const kycSubmitSchema = z.object({
  documents: z.array(z.object({
    type: z.enum(['cni', 'passport', 'carte_electeur']),
    number: z.string().min(5).max(20),
    documentUrl: z.string().url(),
    selfieUrl: z.string().url().optional(),
    issueDate: z.string().optional(),
    expiryDate: z.string().optional(),
    country: z.string().optional(),
  })).min(1, 'Au moins un document est requis'),
  level: z.enum(['basic', 'intermediate', 'advanced']).default('basic'),
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

    // Parse and validate request body
    const body = await request.json();
    const validation = kycSubmitSchema.safeParse(body);

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

    const { documents, level } = validation.data;

    // Submit KYC
    const result = await kycService.submitKYC(
      session.user.id,
      documents as KYCDocument[],
      level as KYCLevel
    );

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      level: result.level,
      message: result.message,
    });
  } catch (error) {
    console.error('[API] KYC submit error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
