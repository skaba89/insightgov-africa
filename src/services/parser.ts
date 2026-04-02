// ============================================
// InsightGov Africa - Service de Parsing
// Gestion des fichiers CSV et Excel
// ============================================

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  ParsedData,
  FileType,
  ColumnMetadata,
  ColumnType,
  SemanticType,
  ColumnStatistics,
  DataQuality,
  DataQualityIssue,
} from '@/types';

// ============================================
// INTERFACES INTERNES
// ============================================

interface ParseResult {
  success: boolean;
  data?: ParsedData;
  error?: string;
}

interface RawColumnAnalysis {
  name: string;
  values: (string | number | boolean | null)[];
  types: Set<string>;
}

// ============================================
// FONCTION PRINCIPALE : Parser un fichier
// ============================================

/**
 * Parse un fichier CSV ou Excel et retourne les données structurées
 * @param file - Le fichier à parser (File ou Buffer)
 * @param fileName - Nom du fichier original
 * @returns ParsedData avec colonnes, données et métadonnées
 */
export async function parseFile(
  file: File | Buffer,
  fileName: string
): Promise<ParseResult> {
  try {
    const fileType = detectFileType(fileName);
    
    if (!fileType) {
      return {
        success: false,
        error: `Type de fichier non supporté. Formats acceptés: CSV, XLS, XLSX`,
      };
    }

    let result: ParsedData;

    switch (fileType) {
      case FileType.CSV:
        result = await parseCSV(file);
        break;
      case FileType.EXCEL:
        result = await parseExcel(file);
        break;
      default:
        return {
          success: false,
          error: `Type de fichier non supporté: ${fileType}`,
        };
    }

    // Enrichir avec les métadonnées du fichier
    result.metadata.fileType = fileType;
    result.metadata.fileName = fileName;
    
    if (file instanceof File) {
      result.metadata.fileSize = file.size;
    } else {
      result.metadata.fileSize = file.length;
    }

    return { success: true, data: result };
  } catch (error) {
    console.error('Erreur parsing fichier:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue lors du parsing',
    };
  }
}

// ============================================
// DÉTECTION DU TYPE DE FICHIER
// ============================================

function detectFileType(fileName: string): FileType | null {
  const extension = fileName.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'csv':
    case 'tsv':
      return FileType.CSV;
    case 'xlsx':
    case 'xls':
      return FileType.EXCEL;
    default:
      return null;
  }
}

// ============================================
// PARSER CSV
// ============================================

async function parseCSV(file: File | Buffer): Promise<ParsedData> {
  return new Promise((resolve, reject) => {
    const parseCallback = (results: Papa.ParseResult<Record<string, unknown>>) => {
      if (results.errors.length > 0) {
        // On continue même avec des erreurs mineures
        console.warn('Warnings parsing CSV:', results.errors);
      }

      const columns = results.meta.fields || [];
      const data = results.data as Record<string, unknown>[];

      resolve({
        columns,
        data,
        metadata: {
          rowCount: data.length,
          columnCount: columns.length,
          fileSize: 0,
          fileName: '',
          fileType: FileType.CSV,
        },
      });
    };

    if (file instanceof File) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        encoding: 'UTF-8',
        complete: parseCallback,
        error: (error) => reject(new Error(`Erreur CSV: ${error.message}`)),
      });
    } else {
      // Buffer - convertir en string
      const content = file.toString('utf-8');
      Papa.parse(content, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: parseCallback,
        error: (error) => reject(new Error(`Erreur CSV: ${error.message}`)),
      });
    }
  });
}

// ============================================
// PARSER EXCEL
// ============================================

async function parseExcel(file: File | Buffer): Promise<ParsedData> {
  let buffer: Buffer;

  if (file instanceof File) {
    // Convertir File en Buffer
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    buffer = file;
  }

  // Lire le workbook
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  
  // Prendre la première feuille par défaut
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convertir en JSON avec headers
  const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });

  // Extraire les colonnes du premier objet
  const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

  // Convertir les valeurs pour une meilleure cohérence
  const data = jsonData.map((row) => {
    const cleanRow: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      cleanRow[key] = convertExcelValue(value);
    }
    return cleanRow;
  });

  return {
    columns,
    data,
    metadata: {
      rowCount: data.length,
      columnCount: columns.length,
      fileSize: buffer.length,
      fileName: '',
      fileType: FileType.EXCEL,
    },
  };
}

// ============================================
// CONVERSION DES VALEURS EXCEL
// ============================================

function convertExcelValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]; // Format YYYY-MM-DD
  }
  
  if (typeof value === 'string') {
    // Essayer de convertir en nombre si possible
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') {
      return num;
    }
    return value.trim();
  }
  
  return String(value);
}

// ============================================
// ANALYSE DES COLONNES
// ============================================

/**
 * Analyse approfondie des colonnes pour générer les métadonnées
 * Cette fonction détecte les types, statistiques et qualité des données
 */
export function analyzeColumns(data: Record<string, unknown>[]): ColumnMetadata[] {
  if (data.length === 0) return [];

  const columns = Object.keys(data[0]);
  
  return columns.map((columnName) => {
    // Extraire toutes les valeurs de cette colonne
    const values = data.map((row) => row[columnName] as string | number | boolean | null);
    
    // Analyser le type de données
    const columnType = detectColumnType(values);
    
    // Détecter le type sémantique
    const semanticType = detectSemanticType(columnName, values, columnType);
    
    // Calculer les statistiques
    const statistics = calculateStatistics(values, columnType);
    
    // Évaluer la qualité des données
    const quality = assessDataQuality(values, columnType);
    
    // Extraire des exemples de valeurs
    const sampleValues = values
      .filter((v) => v !== null && v !== undefined)
      .slice(0, 5);

    return {
      name: sanitizeColumnName(columnName),
      originalName: columnName,
      type: columnType,
      detectedSemanticType: semanticType,
      sampleValues,
      statistics,
      quality,
    };
  });
}

// ============================================
// DÉTECTION DU TYPE DE COLONNE
// ============================================

function detectColumnType(values: (string | number | boolean | null)[]): ColumnType {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined);
  
  if (nonNullValues.length === 0) return ColumnType.STRING;

  // Vérifier si ce sont des booléens
  const boolValues = nonNullValues.filter(
    (v) => typeof v === 'boolean' || v === 'true' || v === 'false' || v === 1 || v === 0
  );
  if (boolValues.length === nonNullValues.length) {
    return ColumnType.BOOLEAN;
  }

  // Vérifier si ce sont des nombres
  const numValues = nonNullValues.filter((v) => typeof v === 'number' && !isNaN(v));
  if (numValues.length === nonNullValues.length) {
    return ColumnType.NUMBER;
  }

  // Vérifier si ce sont des dates
  const dateValues = nonNullValues.filter((v) => {
    if (v instanceof Date) return true;
    if (typeof v !== 'string') return false;
    return isDateString(v);
  });
  if (dateValues.length > nonNullValues.length * 0.8) {
    return ColumnType.DATE;
  }

  return ColumnType.STRING;
}

// ============================================
// DÉTECTION DU TYPE SÉMANTIQUE
// ============================================

function detectSemanticType(
  columnName: string,
  values: (string | number | boolean | null)[],
  columnType: ColumnType
): SemanticType {
  const nameLower = columnName.toLowerCase();
  const nonNullValues = values.filter((v) => v !== null && v !== undefined);
  
  // Détection basée sur le nom de la colonne
  if (nameLower.includes('id') || nameLower.includes('_id') || nameLower.endsWith('id')) {
    return SemanticType.ID;
  }
  
  if (nameLower.includes('email') || nameLower.includes('courriel') || nameLower.includes('mail')) {
    return SemanticType.EMAIL;
  }
  
  if (nameLower.includes('phone') || nameLower.includes('tel') || nameLower.includes('telephone') || nameLower.includes('téléphone')) {
    return SemanticType.PHONE;
  }
  
  if (nameLower.includes('name') || nameLower.includes('nom') || nameLower.includes('prénom') || nameLower.includes('prenom')) {
    return SemanticType.NAME;
  }
  
  if (nameLower.includes('country') || nameLower.includes('pays')) {
    return SemanticType.COUNTRY;
  }
  
  if (nameLower.includes('city') || nameLower.includes('ville')) {
    return SemanticType.CITY;
  }
  
  if (nameLower.includes('region') || nameLower.includes('région') || nameLower.includes('province')) {
    return SemanticType.REGION;
  }
  
  if (nameLower.includes('amount') || nameLower.includes('montant') || nameLower.includes('price') || nameLower.includes('prix') || nameLower.includes('cost') || nameLower.includes('cout')) {
    return SemanticType.CURRENCY;
  }
  
  if (nameLower.includes('percent') || nameLower.includes('pourcent') || nameLower.includes('rate') || nameLower.includes('taux')) {
    return SemanticType.PERCENTAGE;
  }
  
  if (nameLower.includes('count') || nameLower.includes('nombre') || nameLower.includes('qty') || nameLower.includes('quantité') || nameLower.includes('quantity')) {
    return SemanticType.QUANTITY;
  }
  
  if (nameLower.includes('date') || nameLower.includes('jour') || nameLower.includes('mois') || nameLower.includes('année') || nameLower.includes('year')) {
    return SemanticType.DATE;
  }
  
  if (nameLower.includes('category') || nameLower.includes('catégorie') || nameLower.includes('type') || nameLower.includes('status') || nameLower.includes('statut')) {
    return SemanticType.CATEGORY;
  }
  
  if (nameLower.includes('description') || nameLower.includes('desc') || nameLower.includes('commentaire') || nameLower.includes('comment')) {
    return SemanticType.DESCRIPTION;
  }

  // Détection basée sur les valeurs
  if (nonNullValues.length > 0 && columnType === ColumnType.STRING) {
    const sampleValues = nonNullValues.slice(0, 100).map((v) => String(v));
    
    // Vérifier si c'est un email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (sampleValues.filter((v) => emailPattern.test(v)).length > sampleValues.length * 0.8) {
      return SemanticType.EMAIL;
    }
    
    // Vérifier si c'est une catégorie (peu de valeurs uniques)
    const uniqueValues = new Set(sampleValues);
    if (uniqueValues.size <= Math.min(20, sampleValues.length * 0.3)) {
      return SemanticType.CATEGORY;
    }
  }

  if (columnType === ColumnType.NUMBER) {
    return SemanticType.METRIC;
  }

  return SemanticType.UNKNOWN;
}

// ============================================
// CALCUL DES STATISTIQUES
// ============================================

function calculateStatistics(
  values: (string | number | boolean | null)[],
  columnType: ColumnType
): ColumnStatistics {
  const nonNullValues = values.filter((v) => v !== null && v !== undefined);
  const nullCount = values.length - nonNullValues.length;
  const uniqueValues = new Set(nonNullValues.map((v) => String(v)));

  const stats: ColumnStatistics = {
    count: values.length,
    nullCount,
    uniqueCount: uniqueValues.size,
  };

  if (columnType === ColumnType.NUMBER) {
    const numValues = nonNullValues
      .filter((v): v is number => typeof v === 'number' && !isNaN(v))
      .sort((a, b) => a - b);

    if (numValues.length > 0) {
      stats.min = numValues[0];
      stats.max = numValues[numValues.length - 1];
      stats.sum = numValues.reduce((a, b) => a + b, 0);
      stats.mean = stats.sum / numValues.length;
      
      // Médiane
      const mid = Math.floor(numValues.length / 2);
      stats.median = numValues.length % 2 !== 0
        ? numValues[mid]
        : (numValues[mid - 1] + numValues[mid]) / 2;
      
      // Écart-type
      const squaredDiffs = numValues.map((v) => Math.pow(v - stats.mean!, 2));
      stats.stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / numValues.length);
    }
  }

  if (columnType === ColumnType.STRING) {
    const strValues = nonNullValues.map((v) => String(v));
    const lengths = strValues.map((v) => v.length);
    
    if (lengths.length > 0) {
      stats.minLength = Math.min(...lengths);
      stats.maxLength = Math.max(...lengths);
      stats.avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    }
  }

  if (columnType === ColumnType.DATE) {
    const dates = nonNullValues
      .map((v) => {
        if (v instanceof Date) return v;
        if (typeof v === 'string') return new Date(v);
        return null;
      })
      .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length > 0) {
      stats.minDate = dates[0].toISOString().split('T')[0];
      stats.maxDate = dates[dates.length - 1].toISOString().split('T')[0];
    }
  }

  // Top valeurs (pour les catégories)
  const valueCounts = new Map<string, number>();
  nonNullValues.forEach((v) => {
    const key = String(v);
    valueCounts.set(key, (valueCounts.get(key) || 0) + 1);
  });
  
  stats.topValues = Array.from(valueCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([value, count]) => ({ value, count }));

  return stats;
}

// ============================================
// ÉVALUATION DE LA QUALITÉ DES DONNÉES
// ============================================

function assessDataQuality(
  values: (string | number | boolean | null)[],
  columnType: ColumnType
): DataQuality {
  const total = values.length;
  const nonNullValues = values.filter((v) => v !== null && v !== undefined);
  const issues: DataQualityIssue[] = [];

  // Complétude
  const completeness = (nonNullValues.length / total) * 100;
  if (completeness < 80) {
    issues.push({
      type: 'missing_values',
      severity: completeness < 50 ? 'CRITICAL' : completeness < 70 ? 'HIGH' : 'MEDIUM',
      message: `${total - nonNullValues.length} valeurs manquantes (${(100 - completeness).toFixed(1)}%)`,
      affectedRows: total - nonNullValues.length,
      suggestion: 'Considérez remplir les valeurs manquantes ou supprimer les lignes incomplètes',
    });
  }

  // Unicité
  const uniqueValues = new Set(nonNullValues.map((v) => String(v)));
  const uniqueness = (uniqueValues.size / nonNullValues.length) * 100;

  // Validité (basée sur le type)
  let validity = 100;
  if (columnType === ColumnType.NUMBER) {
    const invalidNumbers = nonNullValues.filter(
      (v) => typeof v !== 'number' || isNaN(v)
    ).length;
    validity = ((nonNullValues.length - invalidNumbers) / nonNullValues.length) * 100;
  }

  // Cohérence (basique - format)
  let consistency = 100;
  if (columnType === ColumnType.STRING && nonNullValues.length > 0) {
    // Vérifier la cohérence de la casse
    const hasUpperCase = nonNullValues.some((v) => /[A-Z]/.test(String(v)));
    const hasLowerCase = nonNullValues.some((v) => /[a-z]/.test(String(v)));
    const mixedCase = hasUpperCase && hasLowerCase;
    
    // Vérifier la cohérence du format
    const patterns = nonNullValues.slice(0, 100).map((v) => {
      let pattern = String(v).replace(/[0-9]/g, 'N').replace(/[a-zA-Z]/g, 'A');
      return pattern;
    });
    const uniquePatterns = new Set(patterns);
    if (uniquePatterns.size > 3) {
      consistency = Math.max(0, 100 - uniquePatterns.size * 10);
    }
  }

  // Score global (moyenne pondérée)
  const overallScore = completeness * 0.4 + validity * 0.3 + consistency * 0.2 + Math.min(uniqueness, 100) * 0.1;

  return {
    completeness: Math.round(completeness * 10) / 10,
    uniqueness: Math.round(uniqueness * 10) / 10,
    consistency: Math.round(consistency * 10) / 10,
    validity: Math.round(validity * 10) / 10,
    overallScore: Math.round(overallScore * 10) / 10,
    issues,
  };
}

// ============================================
// UTILITAIRES
// ============================================

function isDateString(value: string): boolean {
  // Formats courants de date
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
    /^\d{4}\/\d{2}\/\d{2}$/, // YYYY/MM/DD
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO
  ];

  if (datePatterns.some((p) => p.test(value))) {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
  return false;
}

function sanitizeColumnName(name: string): string {
  // Convertir en snake_case et supprimer les caractères spéciaux
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// ============================================
// EXPORT PAR DÉFAUT
// ============================================

export default {
  parseFile,
  analyzeColumns,
};
