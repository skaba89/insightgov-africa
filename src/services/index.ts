// ============================================
// InsightGov Africa - Services Index
// Export centralisé de tous les services
// ============================================

export { parseFile, analyzeColumns } from './parser';
export { analyzeDataset, generateKpiConfigs, generateKpiInsight } from './ai-analysis';

// Types réexportés pour faciliter l'import
export type { ParsedData, ColumnMetadata } from '@/types';
export type { AIAnalysisRequest, AIAnalysisResponse } from '@/types';
