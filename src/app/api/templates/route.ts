/**
 * InsightGov Africa - Templates API
 * ===================================
 * API pour la gestion des templates de rapports
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  REPORT_TEMPLATES,
  getTemplatesBySector,
  getTemplatesByOrganizationType,
  getTemplateById,
  applyTemplate,
  detectBestTemplate,
} from '@/lib/templates/report-templates';
import { requireAuth } from '@/lib/auth-middleware';
import type { Sector } from '@/types';

/**
 * GET /api/templates
 * Liste les templates disponibles
 */
export async function GET(request: NextRequest) {
  // Vérifier l'authentification
  const authResult = await requireAuth(request, 'read');
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const auth = authResult.auth;

  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get('sector') as Sector | null;
    const organizationType = searchParams.get('organizationType');
    const templateId = searchParams.get('id');

    // Récupérer un template spécifique
    if (templateId) {
      const template = getTemplateById(templateId);
      if (!template) {
        return NextResponse.json(
          { success: false, error: 'Template non trouvé' },
          { status: 404 }
        );
      }
      return NextResponse.json({ 
        success: true, 
        template,
        metadata: {
          userId: auth.userId,
          organizationId: auth.organizationId,
        },
      });
    }

    // Filtrer par secteur
    if (sector) {
      const templates = getTemplatesBySector(sector);
      return NextResponse.json({ 
        success: true, 
        templates,
        metadata: {
          userId: auth.userId,
          organizationId: auth.organizationId,
        },
      });
    }

    // Filtrer par type d'organisation
    if (organizationType) {
      const templates = getTemplatesByOrganizationType(organizationType);
      return NextResponse.json({ 
        success: true, 
        templates,
        metadata: {
          userId: auth.userId,
          organizationId: auth.organizationId,
        },
      });
    }

    // Retourner tous les templates
    return NextResponse.json({
      success: true,
      templates: REPORT_TEMPLATES,
      count: REPORT_TEMPLATES.length,
      metadata: {
        userId: auth.userId,
        organizationId: auth.organizationId,
      },
    });
  } catch (error) {
    console.error('Erreur récupération templates:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des templates' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/templates
 * Applique un template à un dataset
 */
export async function POST(request: NextRequest) {
  // Vérifier l'authentification
  const authResult = await requireAuth(request, 'write');
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const auth = authResult.auth;

  try {
    const body = await request.json();
    const { templateId, datasetId, customizations, autoDetect } = body;

    // Journalisation pour audit
    console.log(`[Templates] User ${auth.email} (${auth.userId}) applying template: ${templateId || 'auto-detect'}`);

    if (autoDetect) {
      // Détection automatique du meilleur template
      const { columns, sector, organizationType } = body;
      
      if (!columns || !sector) {
        return NextResponse.json(
          { success: false, error: 'columns et sector requis pour la détection automatique' },
          { status: 400 }
        );
      }

      const template = detectBestTemplate(columns, sector, organizationType || 'enterprise');
      
      if (!template) {
        return NextResponse.json(
          { success: false, error: 'Aucun template correspondant trouvé' },
          { status: 404 }
        );
      }

      const config = applyTemplate(template, datasetId || 'new', customizations);
      
      return NextResponse.json({
        success: true,
        template,
        config,
        detected: true,
        metadata: {
          userId: auth.userId,
          organizationId: auth.organizationId,
          executedAt: new Date().toISOString(),
        },
      });
    }

    // Application d'un template spécifique
    if (!templateId) {
      return NextResponse.json(
        { success: false, error: 'templateId requis' },
        { status: 400 }
      );
    }

    const template = getTemplateById(templateId);
    
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template non trouvé' },
        { status: 404 }
      );
    }

    const config = applyTemplate(template, datasetId || 'new', customizations);

    return NextResponse.json({
      success: true,
      template,
      config,
      metadata: {
        userId: auth.userId,
        organizationId: auth.organizationId,
        executedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Erreur application template:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'application du template' },
      { status: 500 }
    );
  }
}
