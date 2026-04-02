/**
 * InsightGov Africa - Branding API
 * ==================================
 * Gestion de la personnalisation par client
 * SÉCURISÉ avec authentification et vérification d'appartenance
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, validateUUID } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// ============================================
// GET - Récupérer les paramètres de branding
// ============================================

export async function GET(request: NextRequest) {
  // Vérification d'authentification
  const authResult = await requireAuth(request, 'read');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    // Utiliser l'organisation de l'utilisateur si pas spécifié
    const targetOrgId = auth.organizationId;

    if (!targetOrgId) {
      // Retourner les valeurs par défaut
      return NextResponse.json({
        success: true,
        branding: getDefaultBranding(null),
      });
    }

    // Essayer de récupérer depuis la base de données
    const branding = await db.clientBranding.findUnique({
      where: { organizationId: targetOrgId },
    });

    if (branding) {
      return NextResponse.json({
        success: true,
        branding,
      });
    }

    // Retourner les valeurs par défaut
    return NextResponse.json({
      success: true,
      branding: getDefaultBranding(targetOrgId),
    });
  } catch (error) {
    console.error('Erreur récupération branding:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// POST - Sauvegarder les paramètres de branding
// ============================================

export async function POST(request: NextRequest) {
  // Vérification d'authentification (admin pour modifier le branding)
  const authResult = await requireAuth(request, 'admin');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const body = await request.json();
    const {
      logoUrl,
      logoUrlDark,
      primaryColor,
      secondaryColor,
      accentColor,
      fontFamily,
      dashboardTitle,
      welcomeMessage,
      chartStyle,
      hideInsightGovBranding,
    } = body;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Aucune organisation associée.' },
        { status: 400 }
      );
    }

    // Vérifier si un enregistrement existe déjà
    const existing = await db.clientBranding.findUnique({
      where: { organizationId: auth.organizationId },
    });

    let branding;

    if (existing) {
      // Mettre à jour
      branding = await db.clientBranding.update({
        where: { organizationId: auth.organizationId },
        data: {
          logoUrl,
          logoUrlDark,
          primaryColor,
          secondaryColor,
          accentColor,
          fontFamily,
          dashboardTitle,
          welcomeMessage,
          chartStyle,
          hideInsightGovBranding,
        },
      });
    } else {
      // Créer
      branding = await db.clientBranding.create({
        data: {
          organizationId: auth.organizationId,
          logoUrl,
          logoUrlDark,
          primaryColor,
          secondaryColor,
          accentColor,
          fontFamily,
          dashboardTitle,
          welcomeMessage,
          chartStyle,
          hideInsightGovBranding,
        },
      });
    }

    // Log de l'activité
    await db.activityLog.create({
      data: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        action: 'settings_change',
        entityType: 'settings',
        metadata: JSON.stringify({ section: 'branding' }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

    return NextResponse.json({
      success: true,
      branding,
    });
  } catch (error) {
    console.error('Erreur sauvegarde branding:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// ============================================
// Fonctions utilitaires
// ============================================

function getDefaultBranding(organizationId: string | null) {
  return {
    organizationId,
    primaryColor: '#7c3aed',
    secondaryColor: '#10b981',
    accentColor: '#f59e0b',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    fontFamily: 'Inter',
    headingFont: 'Inter',
    chartColors: ['#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899'],
    chartStyle: 'modern',
    hideInsightGovBranding: false,
  };
}
