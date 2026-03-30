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
import type { Sector } from '@/types';

/**
 * GET /api/templates
 * Liste les templates disponibles
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sector = searchParams.get('sector') as Sector | null;
  const organizationType = searchParams.get('organizationType');
  const templateId = searchParams.get('id');

  // Récupérer un template spécifique
  if (templateId) {
    const template = getTemplateById(templateId);
    if (!template) {
      return NextResponse.json(
        { error: 'Template non trouvé' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, template });
  }

  // Filtrer par secteur
  if (sector) {
    const templates = getTemplatesBySector(sector);
    return NextResponse.json({ success: true, templates });
  }

  // Filtrer par type d'organisation
  if (organizationType) {
    const templates = getTemplatesByOrganizationType(organizationType);
    return NextResponse.json({ success: true, templates });
  }

  // Retourner tous les templates
  return NextResponse.json({
    success: true,
    templates: REPORT_TEMPLATES,
    count: REPORT_TEMPLATES.length,
  });
}

/**
 * POST /api/templates
 * Applique un template à un dataset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateId, datasetId, customizations, autoDetect } = body;

    if (autoDetect) {
      // Détection automatique du meilleur template
      const { columns, sector, organizationType } = body;
      
      if (!columns || !sector) {
        return NextResponse.json(
          { error: 'columns et sector requis pour la détection automatique' },
          { status: 400 }
        );
      }

      const template = detectBestTemplate(columns, sector, organizationType || 'enterprise');
      
      if (!template) {
        return NextResponse.json(
          { error: 'Aucun template correspondant trouvé' },
          { status: 404 }
        );
      }

      const config = applyTemplate(template, datasetId || 'new', customizations);
      
      return NextResponse.json({
        success: true,
        template,
        config,
        detected: true,
      });
    }

    // Application d'un template spécifique
    if (!templateId) {
      return NextResponse.json(
        { error: 'templateId requis' },
        { status: 400 }
      );
    }

    const template = getTemplateById(templateId);
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template non trouvé' },
        { status: 404 }
      );
    }

    const config = applyTemplate(template, datasetId || 'new', customizations);

    return NextResponse.json({
      success: true,
      template,
      config,
    });
  } catch (error) {
    console.error('Erreur application template:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'application du template' },
      { status: 500 }
    );
  }
}
