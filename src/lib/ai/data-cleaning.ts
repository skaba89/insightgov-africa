/**
 * InsightGov Africa - AI Data Cleaning Service
 * ==============================================
 * Service de nettoyage et préparation automatique des données avec IA.
 * Détecte et corrige automatiquement les problèmes de qualité des données.
 */

import { getOpenAIClient } from './openai';

// =============================================================================
// TYPES
// =============================================================================

export interface DataQualityIssue {
  column: string;
  type: 'missing_values' | 'outliers' | 'duplicates' | 'inconsistent_format' | 'invalid_data' | 'type_mismatch';
  severity: 'low' | 'medium' | 'high' | 'critical';
  count: number;
  percentage: number;
  description: string;
  suggestion: string;
  autoFixable: boolean;
  affectedRows?: number[];
}

export interface CleaningOperation {
  id: string;
  type: 'fill_missing' | 'remove_outliers' | 'deduplicate' | 'standardize_format' | 'correct_type' | 'transform';
  column: string;
  description: string;
  beforeValue?: unknown;
  afterValue?: unknown;
  affectedRows: number;
  confidence: number; // 0-1, IA confidence
  applied: boolean;
}

export interface DataCleaningResult {
  issues: DataQualityIssue[];
  operations: CleaningOperation[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    autoFixableIssues: number;
    rowsAffected: number;
    qualityScoreBefore: number;
    qualityScoreAfter: number;
  };
  recommendations: string[];
}

export interface ColumnStatistics {
  name: string;
  type: 'numeric' | 'text' | 'date' | 'boolean' | 'mixed';
  totalRows: number;
  nullCount: number;
  nullPercentage: number;
  uniqueCount: number;
  uniquePercentage: number;
  duplicateCount: number;
  sampleValues: unknown[];
  statistics?: {
    min?: number;
    max?: number;
    mean?: number;
    median?: number;
    stdDev?: number;
    quartiles?: [number, number, number];
  };
  patterns?: string[];
  anomalies?: number[];
}

// =============================================================================
// DATA QUALITY ANALYSIS
// =============================================================================

/**
 * Analyse la qualité des données et détecte les problèmes
 */
export async function analyzeDataQuality(
  data: Record<string, unknown>[],
  columns: string[]
): Promise<DataQualityIssue[]> {
  const issues: DataQualityIssue[] = [];
  const totalRows = data.length;

  for (const column of columns) {
    const values = data.map(row => row[column]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    
    // 1. Missing Values
    const nullCount = totalRows - nonNullValues.length;
    if (nullCount > 0) {
      const percentage = (nullCount / totalRows) * 100;
      issues.push({
        column,
        type: 'missing_values',
        severity: percentage > 30 ? 'critical' : percentage > 10 ? 'high' : 'medium',
        count: nullCount,
        percentage,
        description: `${nullCount} valeurs manquantes (${percentage.toFixed(1)}%)`,
        suggestion: percentage > 30 
          ? 'Considérer supprimer cette colonne ou imputer les valeurs'
          : 'Imputer avec la moyenne/médiane ou supprimer les lignes',
        autoFixable: percentage < 50,
        affectedRows: values.map((v, i) => v === null || v === undefined || v === '' ? i : -1).filter(i => i >= 0),
      });
    }

    // 2. Duplicates
    const uniqueValues = new Set(nonNullValues.map(v => String(v)));
    const duplicateCount = nonNullValues.length - uniqueValues.size;
    if (duplicateCount > 0 && uniqueValues.size < nonNullValues.length * 0.5) {
      issues.push({
        column,
        type: 'duplicates',
        severity: 'low',
        count: duplicateCount,
        percentage: (duplicateCount / nonNullValues.length) * 100,
        description: `${duplicateCount} valeurs dupliquées détectées`,
        suggestion: 'Vérifier si les doublons sont normaux pour ce type de données',
        autoFixable: false,
      });
    }

    // 3. Type Detection & Inconsistencies
    const detectedTypes = detectColumnTypes(nonNullValues);
    if (detectedTypes.mixed) {
      issues.push({
        column,
        type: 'type_mismatch',
        severity: 'high',
        count: detectedTypes.inconsistentCount,
        percentage: (detectedTypes.inconsistentCount / nonNullValues.length) * 100,
        description: `Types de données incohérents détectés: ${detectedTypes.types.join(', ')}`,
        suggestion: `Standardiser toutes les valeurs en ${detectedTypes.suggestedType}`,
        autoFixable: true,
      });
    }

    // 4. Outliers (for numeric columns)
    if (detectedTypes.primaryType === 'numeric') {
      const numericValues = nonNullValues
        .map(v => parseFloat(String(v)))
        .filter(v => !isNaN(v));
      
      const outliers = detectOutliers(numericValues);
      if (outliers.length > 0) {
        issues.push({
          column,
          type: 'outliers',
          severity: 'medium',
          count: outliers.length,
          percentage: (outliers.length / numericValues.length) * 100,
          description: `${outliers.length} valeurs aberrantes détectées`,
          suggestion: 'Vérifier ces valeurs ou utiliser une transformation (log, winsorization)',
          autoFixable: true,
          affectedRows: outliers.map(v => data.findIndex(row => parseFloat(String(row[column])) === v)),
        });
      }
    }

    // 5. Format Inconsistencies (for dates, phones, emails)
    if (detectedTypes.primaryType === 'text') {
      const formatIssues = detectFormatInconsistencies(nonNullValues.map(String), column);
      if (formatIssues) {
        issues.push({
          column,
          type: 'inconsistent_format',
          severity: 'medium',
          count: formatIssues.count,
          percentage: formatIssues.percentage,
          description: formatIssues.description,
          suggestion: formatIssues.suggestion,
          autoFixable: true,
        });
      }
    }
  }

  return issues.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Détecte les types de données d'une colonne
 */
function detectColumnTypes(values: unknown[]): {
  primaryType: string;
  types: string[];
  mixed: boolean;
  inconsistentCount: number;
  suggestedType: string;
} {
  const typeCounts: Record<string, number> = {};
  
  for (const value of values) {
    const strValue = String(value);
    let type = 'text';
    
    if (!isNaN(Number(strValue)) && strValue.trim() !== '') {
      type = strValue.includes('.') ? 'decimal' : 'numeric';
    } else if (/^\d{4}-\d{2}-\d{2}/.test(strValue) || /^\d{2}\/\d{2}\/\d{4}/.test(strValue)) {
      type = 'date';
    } else if (/^(true|false|vrai|faux|oui|non|yes|no)$/i.test(strValue)) {
      type = 'boolean';
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue)) {
      type = 'email';
    } else if (/^\+?[\d\s-()]{8,}$/.test(strValue)) {
      type = 'phone';
    }
    
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }

  const types = Object.keys(typeCounts);
  const primaryType = types.reduce((a, b) => 
    typeCounts[a] > typeCounts[b] ? a : b, types[0] || 'text'
  );
  
  const mixed = types.length > 1;
  const inconsistentCount = values.length - (typeCounts[primaryType] || 0);
  
  // Suggest the most appropriate type
  let suggestedType = primaryType;
  if (mixed) {
    // Prefer numeric over text if more than 50% are numbers
    if (typeCounts['numeric'] && typeCounts['numeric'] > values.length * 0.5) {
      suggestedType = 'numeric';
    } else if (typeCounts['date'] && typeCounts['date'] > values.length * 0.5) {
      suggestedType = 'date';
    }
  }

  return { primaryType, types, mixed, inconsistentCount, suggestedType };
}

/**
 * Détecte les valeurs aberrantes avec la méthode IQR
 */
function detectOutliers(values: number[]): number[] {
  if (values.length < 4) return [];
  
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  return values.filter(v => v < lowerBound || v > upperBound);
}

/**
 * Détecte les incohérences de format
 */
function detectFormatInconsistencies(values: string[], columnName: string): {
  count: number;
  percentage: number;
  description: string;
  suggestion: string;
} | null {
  const lowerColumn = columnName.toLowerCase();
  
  // Date format check
  if (lowerColumn.includes('date') || lowerColumn.includes('datetime')) {
    const dateFormats = {
      iso: /^\d{4}-\d{2}-\d{2}$/,
      fr: /^\d{2}\/\d{2}\/\d{4}$/,
      us: /^\d{2}\/\d{2}\/\d{4}$/,
      datetime: /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}/,
    };
    
    const formatCounts: Record<string, number> = {};
    for (const value of values) {
      let matched = false;
      for (const [format, regex] of Object.entries(dateFormats)) {
        if (regex.test(value)) {
          formatCounts[format] = (formatCounts[format] || 0) + 1;
          matched = true;
          break;
        }
      }
      if (!matched) formatCounts['unknown'] = (formatCounts['unknown'] || 0) + 1;
    }
    
    const formats = Object.keys(formatCounts);
    if (formats.length > 1 && formatCounts['unknown'] > 0) {
      return {
        count: formatCounts['unknown'],
        percentage: (formatCounts['unknown'] / values.length) * 100,
        description: 'Formats de date incohérents détectés',
        suggestion: 'Standardiser au format ISO 8601 (YYYY-MM-DD)',
      };
    }
  }
  
  // Phone format check
  if (lowerColumn.includes('phone') || lowerColumn.includes('tel') || lowerColumn.includes('mobile')) {
    const withCountryCode = values.filter(v => v.startsWith('+')).length;
    const withoutCountryCode = values.length - withCountryCode;
    
    if (withCountryCode > 0 && withoutCountryCode > 0) {
      return {
        count: withoutCountryCode,
        percentage: (withoutCountryCode / values.length) * 100,
        description: 'Numéros de téléphone avec et sans indicatif pays',
        suggestion: 'Ajouter l\'indicatif pays (+221 pour le Sénégal)',
      };
    }
  }
  
  // Currency format check
  if (lowerColumn.includes('amount') || lowerColumn.includes('price') || lowerColumn.includes('montant')) {
    const withCurrency = values.filter(v => /[€$£FCFA]/.test(v)).length;
    const withoutCurrency = values.length - withCurrency;
    
    if (withCurrency > 0 && withoutCurrency > 0) {
      return {
        count: withoutCurrency,
        percentage: (withoutCurrency / values.length) * 100,
        description: 'Valeurs monétaires avec et sans symbole de devise',
        suggestion: 'Standardiser le format monétaire (ex: 100000 FCFA)',
      };
    }
  }
  
  return null;
}

// =============================================================================
// AI-POWERED CLEANING OPERATIONS
// =============================================================================

/**
 * Génère des opérations de nettoyage automatiques avec IA
 */
export async function generateCleaningOperations(
  data: Record<string, unknown>[],
  issues: DataQualityIssue[],
  context?: {
    organizationType?: string;
    sector?: string;
    columnName?: string;
  }
): Promise<CleaningOperation[]> {
  const operations: CleaningOperation[] = [];

  for (const issue of issues.filter(i => i.autoFixable)) {
    switch (issue.type) {
      case 'missing_values': {
        // Get column statistics for imputation strategy
        const columnData = data.map(row => row[issue.column]);
        const nonNullValues = columnData.filter(v => v !== null && v !== undefined && v !== '');
        
        // Detect type and choose imputation strategy
        const types = detectColumnTypes(nonNullValues);
        
        if (types.primaryType === 'numeric') {
          const numericValues = nonNullValues.map(v => parseFloat(String(v))).filter(v => !isNaN(v));
          const median = numericValues.sort((a, b) => a - b)[Math.floor(numericValues.length / 2)];
          
          operations.push({
            id: `fill_missing_${issue.column}`,
            type: 'fill_missing',
            column: issue.column,
            description: `Remplacer ${issue.count} valeurs manquantes par la médiane (${median.toFixed(2)})`,
            beforeValue: null,
            afterValue: median,
            affectedRows: issue.count,
            confidence: 0.85,
            applied: false,
          });
        } else {
          // For text, use mode (most frequent value)
          const valueCounts: Record<string, number> = {};
          nonNullValues.forEach(v => {
            const str = String(v);
            valueCounts[str] = (valueCounts[str] || 0) + 1;
          });
          const mode = Object.entries(valueCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
          
          operations.push({
            id: `fill_missing_${issue.column}`,
            type: 'fill_missing',
            column: issue.column,
            description: `Remplacer ${issue.count} valeurs manquantes par la valeur la plus fréquente: "${mode}"`,
            beforeValue: null,
            afterValue: mode,
            affectedRows: issue.count,
            confidence: 0.75,
            applied: false,
          });
        }
        break;
      }
      
      case 'outliers': {
        const columnData = data.map(row => row[issue.column]);
        const numericValues = columnData
          .map(v => parseFloat(String(v)))
          .filter(v => !isNaN(v));
        
        const sorted = [...numericValues].sort((a, b) => a - b);
        const q1 = sorted[Math.floor(sorted.length * 0.25)];
        const q3 = sorted[Math.floor(sorted.length * 0.75)];
        
        operations.push({
          id: `winsorize_${issue.column}`,
          type: 'remove_outliers',
          column: issue.column,
          description: `Winsorize ${issue.count} valeurs aberrantes (remplacer par les percentiles 5/95)`,
          beforeValue: `${issue.count} outliers`,
          afterValue: `Bornes: [${q1.toFixed(2)}, ${q3.toFixed(2)}]`,
          affectedRows: issue.count,
          confidence: 0.8,
          applied: false,
        });
        break;
      }
      
      case 'type_mismatch': {
        operations.push({
          id: `standardize_type_${issue.column}`,
          type: 'correct_type',
          column: issue.column,
          description: `Convertir ${issue.count} valeurs en type cohérent`,
          affectedRows: issue.count,
          confidence: 0.9,
          applied: false,
        });
        break;
      }
      
      case 'inconsistent_format': {
        operations.push({
          id: `standardize_format_${issue.column}`,
          type: 'standardize_format',
          column: issue.column,
          description: `Standardiser le format de ${issue.count} valeurs`,
          affectedRows: issue.count,
          confidence: 0.85,
          applied: false,
        });
        break;
      }
    }
  }

  // Use AI to suggest additional transformations
  if (context && data.length > 0) {
    const aiSuggestions = await generateAITransformationSuggestions(data, context);
    operations.push(...aiSuggestions);
  }

  return operations;
}

/**
 * Génère des suggestions de transformation avec GPT-4o
 */
async function generateAITransformationSuggestions(
  data: Record<string, unknown>[],
  context: { organizationType?: string; sector?: string; columnName?: string }
): Promise<CleaningOperation[]> {
  try {
    const sampleData = data.slice(0, 20);
    const columns = Object.keys(data[0] || {});
    
    const prompt = `Analyse ce jeu de données et suggère des transformations pour améliorer la qualité:

Contexte: ${context.organizationType || 'Organisation'} - ${context.sector || 'Secteur non spécifié'}

Colonnes: ${columns.join(', ')}

Échantillon de données (20 premières lignes):
${JSON.stringify(sampleData, null, 2)}

Suggère des transformations spécifiques au contexte africain (FCFA, dates, noms, etc.).
Réponds en JSON avec un tableau de suggestions, chaque suggestion ayant:
- column: nom de la colonne
- type: type de transformation (transform, standardize_format, derive)
- description: description de la transformation
- confidence: 0-1

Exemple de réponse:
[
  {"column": "montant", "type": "transform", "description": "Convertir en FCFA si en EUR", "confidence": 0.7}
]`;

    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Tu es un expert en nettoyage de données pour l\'Afrique. Réponds uniquement en JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        const suggestions = JSON.parse(content);
        return suggestions.map((s: { column: string; type: string; description: string; confidence: number }, i: number) => ({
          id: `ai_suggestion_${i}`,
          type: s.type as CleaningOperation['type'],
          column: s.column,
          description: s.description,
          affectedRows: data.length,
          confidence: s.confidence,
          applied: false,
        }));
      } catch {
        return [];
      }
    }
  } catch (error) {
    console.error('Erreur génération suggestions IA:', error);
  }

  return [];
}

// =============================================================================
// APPLY CLEANING OPERATIONS
// =============================================================================

/**
 * Applique les opérations de nettoyage aux données
 */
export function applyCleaningOperations(
  data: Record<string, unknown>[],
  operations: CleaningOperation[]
): Record<string, unknown>[] {
  const cleanedData = [...data];
  
  for (const op of operations) {
    if (!op.applied) continue;
    
    switch (op.type) {
      case 'fill_missing': {
        for (let i = 0; i < cleanedData.length; i++) {
          const value = cleanedData[i][op.column];
          if (value === null || value === undefined || value === '') {
            cleanedData[i] = { ...cleanedData[i], [op.column]: op.afterValue };
          }
        }
        break;
      }
      
      case 'remove_outliers': {
        const columnData = cleanedData.map(row => row[op.column]);
        const numericValues = columnData
          .map(v => parseFloat(String(v)))
          .filter(v => !isNaN(v));
        
        const sorted = [...numericValues].sort((a, b) => a - b);
        const p5 = sorted[Math.floor(sorted.length * 0.05)];
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        
        for (let i = 0; i < cleanedData.length; i++) {
          const value = parseFloat(String(cleanedData[i][op.column]));
          if (!isNaN(value)) {
            if (value < p5) cleanedData[i] = { ...cleanedData[i], [op.column]: p5 };
            else if (value > p95) cleanedData[i] = { ...cleanedData[i], [op.column]: p95 };
          }
        }
        break;
      }
      
      case 'standardize_format': {
        const lowerColumn = op.column.toLowerCase();
        
        for (let i = 0; i < cleanedData.length; i++) {
          const value = String(cleanedData[i][op.column] || '');
          
          // Date standardization
          if (lowerColumn.includes('date')) {
            // Try to parse various date formats
            const dateMatch = value.match(/(\d{1,4})[\/\-](\d{1,2})[\/\-](\d{1,4})/);
            if (dateMatch) {
              // Assume DD/MM/YYYY or YYYY-MM-DD
              let year: number, month: number, day: number;
              if (dateMatch[1].length === 4) {
                [year, month, day] = [parseInt(dateMatch[1]), parseInt(dateMatch[2]), parseInt(dateMatch[3])];
              } else {
                [day, month, year] = [parseInt(dateMatch[1]), parseInt(dateMatch[2]), parseInt(dateMatch[3])];
              }
              if (year < 100) year += 2000;
              cleanedData[i] = { ...cleanedData[i], [op.column]: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` };
            }
          }
          
          // Phone standardization (Senegal)
          if (lowerColumn.includes('phone') || lowerColumn.includes('tel')) {
            const digits = value.replace(/\D/g, '');
            if (digits.length >= 9) {
              const localNumber = digits.slice(-9);
              cleanedData[i] = { ...cleanedData[i], [op.column]: `+221 ${localNumber.slice(0, 2)} ${localNumber.slice(2, 5)} ${localNumber.slice(5, 7)} ${localNumber.slice(7, 9)}` };
            }
          }
          
          // Name capitalization
          if (lowerColumn.includes('nom') || lowerColumn.includes('name') || lowerColumn.includes('prenom')) {
            cleanedData[i] = { 
              ...cleanedData[i], 
              [op.column]: value.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
            };
          }
        }
        break;
      }
      
      case 'correct_type': {
        for (let i = 0; i < cleanedData.length; i++) {
          const value = cleanedData[i][op.column];
          const numValue = parseFloat(String(value));
          if (!isNaN(numValue) && String(value).trim() !== '') {
            cleanedData[i] = { ...cleanedData[i], [op.column]: numValue };
          }
        }
        break;
      }
    }
  }
  
  return cleanedData;
}

// =============================================================================
// QUALITY SCORING
// =============================================================================

/**
 * Calcule un score de qualité des données (0-100)
 */
export function calculateQualityScore(
  data: Record<string, unknown>[],
  issues: DataQualityIssue[]
): number {
  if (data.length === 0) return 0;
  
  const totalCells = data.length * Object.keys(data[0] || {}).length;
  if (totalCells === 0) return 0;
  
  let penalty = 0;
  
  for (const issue of issues) {
    const weight = {
      critical: 10,
      high: 5,
      medium: 2,
      low: 1,
    }[issue.severity];
    
    penalty += (issue.count / totalCells) * 100 * weight;
  }
  
  return Math.max(0, Math.min(100, 100 - penalty));
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

export async function cleanDataWithAI(
  data: Record<string, unknown>[],
  context?: {
    organizationType?: string;
    sector?: string;
  }
): Promise<DataCleaningResult> {
  const columns = Object.keys(data[0] || {});
  
  // Analyze data quality
  const issues = await analyzeDataQuality(data, columns);
  
  // Generate cleaning operations
  const operations = await generateCleaningOperations(data, issues, context);
  
  // Calculate quality scores
  const qualityScoreBefore = calculateQualityScore(data, issues);
  
  // Apply auto-fixable operations with high confidence
  const autoApplyOps = operations.filter(op => op.confidence >= 0.8);
  autoApplyOps.forEach(op => { op.applied = true; });
  
  const cleanedData = applyCleaningOperations(data, autoApplyOps);
  
  // Re-analyze after cleaning
  const issuesAfter = await analyzeDataQuality(cleanedData, columns);
  const qualityScoreAfter = calculateQualityScore(cleanedData, issuesAfter);
  
  // Generate recommendations
  const recommendations = generateRecommendations(issues, context);
  
  return {
    issues,
    operations,
    summary: {
      totalIssues: issues.length,
      criticalIssues: issues.filter(i => i.severity === 'critical').length,
      autoFixableIssues: issues.filter(i => i.autoFixable).length,
      rowsAffected: data.length,
      qualityScoreBefore,
      qualityScoreAfter,
    },
    recommendations,
  };
}

/**
 * Génère des recommandations contextuelles
 */
function generateRecommendations(
  issues: DataQualityIssue[],
  context?: { organizationType?: string; sector?: string }
): string[] {
  const recommendations: string[] = [];
  
  // General recommendations based on issues
  if (issues.some(i => i.type === 'missing_values' && i.severity === 'critical')) {
    recommendations.push('Certaines colonnes ont plus de 30% de valeurs manquantes. Considérer les supprimer ou collecter plus de données.');
  }
  
  if (issues.some(i => i.type === 'outliers')) {
    recommendations.push('Des valeurs aberrantes ont été détectées. Vérifiez si ce sont des erreurs de saisie ou des cas légitimes.');
  }
  
  if (issues.some(i => i.type === 'type_mismatch')) {
    recommendations.push('Standardisez les types de données avant l\'analyse pour éviter les erreurs.');
  }
  
  // Context-specific recommendations
  if (context?.sector === 'health') {
    recommendations.push('Pour les données de santé, assurez-vous que les identifiants patients sont anonymisés.');
  }
  
  if (context?.sector === 'finance') {
    recommendations.push('Vérifiez que les montants sont dans la bonne devise (FCFA pour la zone CEMAC/UEMOA).');
  }
  
  if (context?.organizationType === 'ministry') {
    recommendations.push('Pour les ministères, assurez-vous que les données sont conformes aux standards de reporting gouvernementaux.');
  }
  
  return recommendations;
}

export default {
  analyzeDataQuality,
  generateCleaningOperations,
  applyCleaningOperations,
  calculateQualityScore,
  cleanDataWithAI,
};
