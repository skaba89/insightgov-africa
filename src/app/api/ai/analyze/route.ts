// ============================================
// InsightGov Africa - API AI Analyze
// Analyse IA des datasets
// SÉCURISÉ avec authentification et vérification des limites
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { analyzeDataset, generateKpiConfigs } from '@/services/ai-analysis';
import { analyzeColumns } from '@/services/parser';
import { parseFile } from '@/services/parser';
import { OrganizationType, OrganizationTypeEnum } from '@/types';
import { requireAuth, checkPlanLimit } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// Configuration des limites de fichiers
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_ROWS_PREVIEW = 50;
const MAX_ROWS_ANALYSIS = 100;

// Types de fichiers autorisés
const ALLOWED_FILE_TYPES = ['csv', 'xlsx', 'xls'];

// ============================================
// POST /api/ai/analyze - Analyser un fichier
// ============================================

export async function POST(request: NextRequest) {
  // Vérification d'authentification (write permission requise pour analyse)
  const authResult = await requireAuth(request, 'write');
  if (authResult instanceof NextResponse) return authResult;

  const { auth } = authResult;

  try {
    const formData = await request.formData();
    
    const file = formData.get('file') as File | null;
    const organizationType = (formData.get('organizationType') as OrganizationType) || OrganizationTypeEnum.OTHER;
    const sector = (formData.get('sector') as string) || '';
    const subSector = (formData.get('subSector') as string) || '';
    const language = (formData.get('language') as 'fr' | 'en') || 'fr';

    // Validation du fichier
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Fichier requis' },
        { status: 400 }
      );
    }

    // Vérifier la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: `Fichier trop volumineux. Taille maximum: ${MAX_FILE_SIZE / 1024 / 1024} MB` },
        { status: 400 }
      );
    }

    // Vérifier le type de fichier
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.split('.').pop() || '';
    
    if (!ALLOWED_FILE_TYPES.includes(fileExtension)) {
      return NextResponse.json(
        { success: false, error: `Type de fichier non supporté. Types autorisés: ${ALLOWED_FILE_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    // Vérifier les limites du plan si l'utilisateur a une organisation
    if (auth.organizationId) {
      const planCheck = await checkPlanLimit(auth.organizationId, 'datasets');
      if (!planCheck.allowed) {
        return NextResponse.json(
          { 
            success: false, 
            error: planCheck.message || 'Limite du plan atteinte',
            code: 'PLAN_LIMIT_EXCEEDED',
            current: planCheck.current,
            limit: planCheck.limit
          },
          { status: 402 } // Payment Required
        );
      }
    }

    // Parser le fichier
    const parseResult = await parseFile(file, file.name);
    
    if (!parseResult.success || !parseResult.data) {
      return NextResponse.json(
        { success: false, error: parseResult.error || 'Erreur de parsing' },
        { status: 400 }
      );
    }

    const parsedData = parseResult.data;

    // Analyser les colonnes
    const columnsMetadata = analyzeColumns(parsedData.data);

    // Analyser avec l'IA
    const aiResponse = await analyzeDataset({
      organizationType,
      sector,
      subSector,
      columns: columnsMetadata,
      sampleData: parsedData.data.slice(0, MAX_ROWS_ANALYSIS),
      language,
    });

    if (!aiResponse.success) {
      return NextResponse.json(
        { success: false, error: aiResponse.error || 'Erreur analyse IA' },
        { status: 500 }
      );
    }

    // Générer les configs de KPIs
    const kpiConfigs = generateKpiConfigs(
      aiResponse.suggestedKpis,
      aiResponse.suggestedCharts,
      columnsMetadata
    );

    // Log de l'activité
    if (auth.organizationId && db) {
      await db.activityLog.create({
        data: {
          userId: auth.userId,
          organizationId: auth.organizationId,
          action: 'analyze',
          entityType: 'dataset',
          metadata: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            rowCount: parsedData.metadata.rowCount,
            columnCount: parsedData.metadata.columnCount,
            sector,
          }),
        },
      }).catch(err => console.error('Failed to log activity:', err));
    }

    return NextResponse.json({
      success: true,
      data: {
        fileMetadata: {
          fileName: file.name,
          fileSize: file.size,
          rowCount: parsedData.metadata.rowCount,
          columnCount: parsedData.metadata.columnCount,
          fileType: parsedData.metadata.fileType,
        },
        columns: columnsMetadata,
        datasetSummary: aiResponse.datasetSummary,
        suggestedKpis: aiResponse.suggestedKpis,
        suggestedCharts: aiResponse.suggestedCharts,
        generatedKpiConfigs: kpiConfigs,
        insights: aiResponse.insights,
        recommendations: aiResponse.recommendations,
        sampleData: parsedData.data.slice(0, MAX_ROWS_PREVIEW),
      },
    });
  } catch (error) {
    console.error('Erreur POST ai/analyze:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'analyse' },
      { status: 500 }
    );
  }
}
