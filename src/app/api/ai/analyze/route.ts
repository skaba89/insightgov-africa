// ============================================
// InsightGov Africa - API AI Analyze
// Analyse IA des datasets
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { analyzeDataset, generateKpiConfigs } from '@/services/ai-analysis';
import { analyzeColumns } from '@/services/parser';
import { parseFile } from '@/services/parser';
import { OrganizationType, OrganizationTypeEnum } from '@/types';

// ============================================
// POST /api/ai/analyze - Analyser un fichier
// ============================================

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const file = formData.get('file') as File | null;
    const organizationType = (formData.get('organizationType') as OrganizationType) || OrganizationTypeEnum.OTHER;
    const sector = (formData.get('sector') as string) || '';
    const subSector = (formData.get('subSector') as string) || '';
    const language = (formData.get('language') as string) || 'fr';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Fichier requis' },
        { status: 400 }
      );
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
      sampleData: parsedData.data.slice(0, 20),
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
        sampleData: parsedData.data.slice(0, 50), // Retourner un échantillon pour prévisualisation
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
