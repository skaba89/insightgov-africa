/**
 * InsightGov Africa - SMS Notification API
 * =========================================
 * API for sending SMS notifications
 * SÉCURISÉ avec authentification et vérification des permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { SMSService, SMS_TEMPLATES } from '@/lib/sms-service';
import { db } from '@/lib/db';
import { z } from 'zod';

// ============================================
// VALIDATION SCHEMAS
// ============================================

const sendSMSSchema = z.object({
  phone: z.string().min(8, 'Numéro de téléphone invalide'),
  message: z.string().min(1, 'Message requis').max(1530, 'Message trop long'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
});

const sendTemplateSchema = z.object({
  phone: z.string().min(8, 'Numéro de téléphone invalide'),
  templateId: z.string().refine(
    (val) => Object.keys(SMS_TEMPLATES).includes(val),
    { message: 'Template ID inval' }
  ),
  variables: z.record(z.string(), z.union([z.string(), z.number()] )),
});

const verifyPhoneSchema = z.object({
  phone: z.string().min(8, 'Numéro de téléphone invalide'),
});

// ============================================
// POST /api/notifications/sms - Send SMS
// ============================================

export async function POST(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    
    // Check if using template or custom message
    if (body.templateId) {
      // Validate template request
      const validation = sendTemplateSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Données invalides', 
            details: validation.error.errors 
          },
          { status: 400 }
        );
      }

      const { phone, templateId, variables } = validation.data;

      // Check if SMS service is available
      if (!SMSService.isAvailable()) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Service SMS non configuré. Contactez l\'administrateur.',
            code: 'SMS_NOT_CONFIGURED'
          },
          { status: 503 }
        );
      }

      // Send SMS using template
      const result = await SMSService.sendTemplate(
        phone,
        templateId as keyof typeof SMS_TEMPLATES,
        variables
      );

      // Log the SMS
      if (db) {
        await db.sMSLog.create({
          data: {
            organizationId: auth.organizationId,
            userId: auth.userId,
            phone,
            message: result.success ? 'Template: ' + templateId : 'Failed',
            templateId,
            status: result.success ? 'sent' : 'failed',
            provider: 'configured',
            messageId: result.messageId,
            errorMessage: result.error,
          },
        }).catch(err => console.error('Failed to log SMS:', err));
      }

      return NextResponse.json({
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });

    } else {
      // Validate custom message request
      const validation = sendSMSSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Données invalides', 
            details: validation.error.errors 
          },
          { status: 400 }
        );
      }

      const { phone, message, priority } = validation.data;

      // Check if SMS service is available
      if (!SMSService.isAvailable()) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Service SMS non configuré. Contactez l\'administrateur.',
            code: 'SMS_NOT_CONFIGURED'
          },
          { status: 503 }
        );
      }

      // Send SMS
      const result = await SMSService.send({
        to: phone,
        message,
        priority: priority || 'normal',
      });

      // Log the SMS
      if (db) {
        await db.sMSLog.create({
          data: {
            organizationId: auth.organizationId,
            userId: auth.userId,
            phone,
            message,
            status: result.success ? 'sent' : 'failed',
            provider: 'configured',
            messageId: result.messageId,
            errorMessage: result.error,
            priority: priority || 'normal',
          },
        }).catch(err => console.error('Failed to log SMS:', err));
      }

      return NextResponse.json({
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[SMS API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'envoi du SMS' },
      { status: 500 }
    );
  }
}

// ============================================
// GET /api/notifications/sms - Get available templates
// ============================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'templates') {
    // Return available templates
    return NextResponse.json({
      success: true,
      templates: Object.entries(SMS_TEMPLATES).map(([key, template]) => ({
        id: key,
        name: template.name,
        category: template.category,
        variables: template.variables,
        template: template.template,
      })),
    });
  }

  if (action === 'logs') {
    // Return SMS logs for the organization
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!db) {
      return NextResponse.json({
        success: true,
        logs: [],
        total: 0,
      });
    }

    try {
      const logs = await db.sMSLog.findMany({
        where: {
          organizationId: auth.organizationId,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      const total = await db.sMSLog.count({
        where: {
          organizationId: auth.organizationId,
        },
      });

      return NextResponse.json({
        success: true,
        logs,
        total,
        pagination: {
          limit,
          offset,
          hasMore: total > offset + limit,
        },
      });
    } catch (error) {
      console.error('[SMS API] Error fetching logs:', error);
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la récupération des logs' },
        { status: 500 }
      );
    }
  }

  // Check SMS service status
  return NextResponse.json({
    success: true,
    available: SMSService.isAvailable(),
    provider: process.env.SMS_PROVIDER || 'not configured',
  });
}

// ============================================
// PUT /api/notifications/sms - Verify phone number
// ============================================

export async function PUT(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const validation = verifyPhoneSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Numéro de téléphone invalide' },
        { status: 400 }
      );
    }

    const { phone } = validation.data;

    if (!SMSService.isAvailable()) {
      return NextResponse.json(
        { success: false, error: 'Service SMS non configuré' },
        { status: 503 }
      );
    }

    // Generate verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store the verification code
    if (db) {
      await db.userPhone.upsert({
        where: { userId: auth.userId },
        create: {
          userId: auth.userId,
          phone,
          verificationCode: code,
          verificationExpires: expiresAt,
        },
        update: {
          phone,
          verificationCode: code,
          verificationExpires: expiresAt,
          isVerified: false,
        },
      });
    }

    // Send verification SMS
    const result = await SMSService.sendVerificationCode(phone, code, 10);

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? 'Code de vérification envoyé' 
        : 'Erreur lors de l\'envoi du code',
      error: result.error,
    });
  } catch (error) {
    console.error('[SMS API] Error verifying phone:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}
