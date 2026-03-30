/**
 * InsightGov Africa - File Parser Utilities
 * ==========================================
 * Utilitaires pour parser les fichiers CSV, Excel, JSON et Parquet.
 * Extrait les données et les métadonnées pour analyse IA.
 */

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { ColumnMetadata, DataType, FileValidationResult } from '@/types';

/**
 * Options de parsing
 */
interface ParseOptions {
  /** Nombre maximum de lignes à analyser */
  maxRows?: number;
  /** Encodage forcé (sinon détection automatique) */
  encoding?: string;
  /** Délimiteur forcé (sinon détection automatique) */
  delimiter?: string;
}

/**
 * Résultat du parsing
 */
interface ParseResult {
  success: boolean;
  data: Record<string, unknown>[];
  headers: string[];
  rowCount: number;
  columnCount: number;
  errors: string[];
  warnings: string[];
}

/**
 * Convertit un File en texte (pour CSV)
 */
async function fileToText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(arrayBuffer);
}

/**
 * Parse un fichier CSV
 * Détecte automatiquement l'encodage et le délimiteur
 */
export async function parseCSV(
  file: File,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const { maxRows = 10000 } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Lire le fichier comme texte
    const text = await fileToText(file);

    return new Promise((resolve) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        preview: maxRows,
        delimiter: options.delimiter,
        transformHeader: (header) => cleanColumnName(header),
        complete: (results) => {
          // Collecter les erreurs de parsing
          if (results.errors.length > 0) {
            results.errors.forEach((err) => {
              if (err.type === 'delimiter') {
                errors.push(`Délimiteur non détecté à la ligne ${err.row}`);
              } else if (err.type === 'fieldMismatch') {
                warnings.push(`Incohérence de champs à la ligne ${err.row}`);
              }
            });
          }

          const headers = results.meta.fields || [];
          const data = results.data as Record<string, unknown>[];

          resolve({
            success: errors.length === 0,
            data,
            headers,
            rowCount: data.length,
            columnCount: headers.length,
            errors,
            warnings,
          });
        },
        error: (error) => {
          resolve({
            success: false,
            data: [],
            headers: [],
            rowCount: 0,
            columnCount: 0,
            errors: [`Erreur de parsing CSV: ${error.message}`],
            warnings,
          });
        },
      });
    });
  } catch (error) {
    return {
      success: false,
      data: [],
      headers: [],
      rowCount: 0,
      columnCount: 0,
      errors: [`Erreur de lecture du fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`],
      warnings,
    };
  }
}

/**
 * Parse un fichier Excel (.xlsx, .xls)
 * Supporte plusieurs feuilles (prend la première par défaut)
 */
export async function parseExcel(
  file: File,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const { maxRows = 10000 } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Lire le fichier comme ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (workbook.SheetNames.length === 0) {
      return {
        success: false,
        data: [],
        headers: [],
        rowCount: 0,
        columnCount: 0,
        errors: ['Le fichier Excel ne contient aucune feuille'],
        warnings,
      };
    }

    // Si plusieurs feuilles, avertir l'utilisateur
    if (workbook.SheetNames.length > 1) {
      warnings.push(
        `Le fichier contient ${workbook.SheetNames.length} feuilles. Seule la première "${workbook.SheetNames[0]}" sera analysée.`
      );
    }

    // Prendre la première feuille
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir en JSON avec options
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      worksheet,
      {
        header: 'A', // Utiliser les lettres de colonnes si pas d'en-tête
        defval: null, // Valeur par défaut pour les cellules vides
        raw: false, // Garder les valeurs formatées (pas les valeurs raw)
      }
    );

    // Limiter le nombre de lignes
    const limitedData = jsonData.slice(0, maxRows);

    if (limitedData.length < jsonData.length) {
      warnings.push(
        `Seules les ${maxRows} premières lignes ont été analysées sur ${jsonData.length} au total.`
      );
    }

    // Extraire les en-têtes (première ligne ou clés de l'objet)
    const headers = limitedData.length > 0 
      ? Object.keys(limitedData[0]).map(cleanColumnName)
      : [];

    // Nettoyer les noms de colonnes dans les données
    const cleanedData = limitedData.map((row) => {
      const cleanedRow: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        cleanedRow[cleanColumnName(key)] = value;
      }
      return cleanedRow;
    });

    return {
      success: true,
      data: cleanedData,
      headers,
      rowCount: cleanedData.length,
      columnCount: headers.length,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      headers: [],
      rowCount: 0,
      columnCount: 0,
      errors: [
        `Erreur de parsing Excel: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      ],
      warnings,
    };
  }
}

/**
 * Parse un fichier JSON (.json)
 * Supporte les formats:
 * - Array d'objets: [{...}, {...}]
 * - Objet avec propriété data: { "data": [...] }
 * - Objet avec propriété records: { "records": [...] }
 * - NDJSON (Newline Delimited JSON): {...}\n{...}
 */
export async function parseJSON(
  file: File,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const { maxRows = 10000 } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Lire le fichier comme texte
    const text = await fileToText(file);
    
    let jsonData: Record<string, unknown>[] = [];
    
    // Essayer de parser le JSON standard d'abord
    try {
      const parsed = JSON.parse(text);
      
      // Détecter le format
      if (Array.isArray(parsed)) {
        // Format: [{...}, {...}]
        jsonData = parsed;
      } else if (parsed && typeof parsed === 'object') {
        // Chercher les propriétés communes qui contiennent les données
        const possibleDataKeys = ['data', 'records', 'results', 'items', 'rows', 'values'];
        let found = false;
        
        for (const key of possibleDataKeys) {
          if (Array.isArray(parsed[key])) {
            jsonData = parsed[key];
            found = true;
            break;
          }
        }
        
        if (!found) {
          // Si c'est un objet simple, le wrapper dans un array
          if (Object.keys(parsed).length > 0) {
            jsonData = [parsed];
            warnings.push('Le JSON est un objet unique. Il a été converti en tableau.');
          }
        }
      }
    } catch {
      // Si le parsing JSON standard échoue, essayer NDJSON
      try {
        const lines = text.split('\n').filter(line => line.trim());
        jsonData = lines.map((line, index) => {
          try {
            return JSON.parse(line);
          } catch {
            warnings.push(`Ligne ${index + 1} ignorée: JSON invalide`);
            return null;
          }
        }).filter((item): item is Record<string, unknown> => item !== null);
        
        if (jsonData.length > 0) {
          warnings.push('Format NDJSON détecté (une ligne = un objet JSON)');
        }
      } catch {
        errors.push('Impossible de parser le fichier JSON. Format non reconnu.');
        return {
          success: false,
          data: [],
          headers: [],
          rowCount: 0,
          columnCount: 0,
          errors,
          warnings,
        };
      }
    }

    if (jsonData.length === 0) {
      errors.push('Le fichier JSON ne contient aucune donnée exploitable.');
      return {
        success: false,
        data: [],
        headers: [],
        rowCount: 0,
        columnCount: 0,
        errors,
        warnings,
      };
    }

    // Limiter le nombre de lignes
    const limitedData = jsonData.slice(0, maxRows);

    if (limitedData.length < jsonData.length) {
      warnings.push(
        `Seules les ${maxRows} premières lignes ont été analysées sur ${jsonData.length} au total.`
      );
    }

    // Extraire les en-têtes (toutes les clés uniques)
    const allKeys = new Set<string>();
    limitedData.forEach(row => {
      if (row && typeof row === 'object') {
        Object.keys(row).forEach(key => allKeys.add(cleanColumnName(key)));
      }
    });
    const headers = Array.from(allKeys);

    // Nettoyer les noms de colonnes dans les données
    const cleanedData = limitedData.map((row) => {
      const cleanedRow: Record<string, unknown> = {};
      if (row && typeof row === 'object') {
        for (const [key, value] of Object.entries(row)) {
          cleanedRow[cleanColumnName(key)] = value;
        }
      }
      return cleanedRow;
    });

    return {
      success: true,
      data: cleanedData,
      headers,
      rowCount: cleanedData.length,
      columnCount: headers.length,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      headers: [],
      rowCount: 0,
      columnCount: 0,
      errors: [
        `Erreur de parsing JSON: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      ],
      warnings,
    };
  }
}

/**
 * Parse un fichier Parquet (.parquet)
 * Note: Le parsing Parquet côté client est limité. Pour une meilleure expérience,
 * utilisez un serveur pour convertir le Parquet en JSON.
 * Cette implémentation tente de lire les données si le format est supporté.
 */
export async function parseParquet(
  file: File,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const { maxRows = 10000 } = options;
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Lire le fichier comme ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Le parsing Parquet natif dans le navigateur est complexe
    // On utilise une approche simplifiée qui tente de détecter le format
    
    // Vérifier la signature magic Parquet: "PAR1"
    const view = new Uint8Array(arrayBuffer, 0, 4);
    const magic = String.fromCharCode(...view);
    
    if (magic !== 'PAR1') {
      // Essayer de voir si c'est peut-être du JSON déguisé
      try {
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(arrayBuffer);
        const parsed = JSON.parse(text);
        
        warnings.push('Le fichier n\'a pas la signature Parquet standard mais semble être du JSON valide. Traitement comme JSON.');
        
        // Parser comme JSON
        const jsonResult = await parseJSON(file, options);
        return jsonResult;
      } catch {
        errors.push('Le fichier n\'a pas le format Parquet valide (signature "PAR1" attendue)');
        return {
          success: false,
          data: [],
          headers: [],
          rowCount: 0,
          columnCount: 0,
          errors,
          warnings,
        };
      }
    }
    
    // Pour un vrai fichier Parquet, on doit utiliser une bibliothèque serveur
    // Ici on informe l'utilisateur et on suggère une conversion
    warnings.push('Les fichiers Parquet doivent être convertis en JSON ou CSV avant l\'import. Conversion automatique en cours...');
    
    // Tenter d'extraire les données en utilisant une méthode simplifiée
    // Note: Ceci est une implémentation basique et peut ne pas fonctionner pour tous les fichiers Parquet
    try {
      // Utiliser Apache Arrow si disponible (sera chargé dynamiquement)
      const parquetData = await parseParquetWithArrow(arrayBuffer, maxRows);
      
      if (parquetData.data.length > 0) {
        warnings.push(`Fichier Parquet parsé avec succès via Apache Arrow. ${parquetData.data.length} lignes extraites.`);
        return {
          success: true,
          data: parquetData.data,
          headers: parquetData.headers,
          rowCount: parquetData.data.length,
          columnCount: parquetData.headers.length,
          errors: [],
          warnings,
        };
      }
    } catch (arrowError) {
      console.warn('Apache Arrow parsing failed:', arrowError);
    }
    
    // Fallback: suggérer la conversion manuelle
    errors.push(
      'Le fichier Parquet ne peut pas être lu directement dans le navigateur. ' +
      'Veuillez le convertir en JSON ou CSV avant l\'import, ou utiliser notre API serveur.'
    );
    
    return {
      success: false,
      data: [],
      headers: [],
      rowCount: 0,
      columnCount: 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      headers: [],
      rowCount: 0,
      columnCount: 0,
      errors: [
        `Erreur de parsing Parquet: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
      ],
      warnings,
    };
  }
}

/**
 * Tente de parser un Parquet avec Apache Arrow (chargement dynamique)
 */
async function parseParquetWithArrow(
  arrayBuffer: ArrayBuffer,
  maxRows: number
): Promise<{ data: Record<string, unknown>[]; headers: string[] }> {
  try {
    // @ts-ignore - arrow module chargé dynamiquement si disponible
    const arrow = await import('apache-arrow').catch(() => null);
    
    if (!arrow) {
      throw new Error('Apache Arrow non disponible');
    }
    
    // Lire la table Parquet
    const table = arrow.tableFromIPC(arrayBuffer);
    
    // Convertir en array d'objets
    const data: Record<string, unknown>[] = [];
    const headers: string[] = table.schema.fields.map(f => f.name);
    
    for (let i = 0; i < Math.min(table.numRows, maxRows); i++) {
      const row: Record<string, unknown> = {};
      headers.forEach(header => {
        const column = table.getChild(header);
        if (column) {
          row[header] = column.get(i);
        }
      });
      data.push(row);
    }
    
    return { data, headers };
  } catch (error) {
    throw new Error(`Erreur Apache Arrow: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Parse un fichier automatiquement selon son extension
 */
export async function parseFile(
  file: File,
  options: ParseOptions = {}
): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'csv':
      return parseCSV(file, options);
    case 'xlsx':
    case 'xls':
      return parseExcel(file, options);
    case 'json':
      return parseJSON(file, options);
    case 'parquet':
      return parseParquet(file, options);
    default:
      return {
        success: false,
        data: [],
        headers: [],
        rowCount: 0,
        columnCount: 0,
        errors: [`Format de fichier non supporté: .${extension}. Formats acceptés: CSV, XLSX, XLS, JSON, Parquet.`],
        warnings: [],
      };
  }
}

/**
 * Nettoie un nom de colonne
 * Supprime les espaces, caractères spéciaux, et standardise
 */
export function cleanColumnName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, '_')           // Espaces -> underscore
    .replace(/[^\w\u00C0-\u017F]/g, '_') // Caractères spéciaux (sauf accents)
    .replace(/_+/g, '_')            // Underscores multiples -> simple
    .replace(/^_|_$/g, '')          // Supprime underscore au début/fin
    .toLowerCase();
}

/**
 * Détecte le type de données d'une colonne
 * Analyse un échantillon de valeurs pour déterminer le type
 */
export function detectDataType(
  values: (string | number | boolean | null | undefined)[]
): DataType {
  // Filtrer les valeurs non nulles
  const nonNullValues = values.filter(
    (v) => v !== null && v !== undefined && v !== ''
  );

  if (nonNullValues.length === 0) {
    return 'unknown';
  }

  // Échantillon pour l'analyse (max 100 valeurs)
  const sample = nonNullValues.slice(0, 100);
  const sampleStrings = sample.map((v) => String(v).trim());

  // Vérifier si ce sont des booléens
  const booleanPatterns = ['true', 'false', 'vrai', 'faux', 'oui', 'non', '0', '1', 'yes', 'no'];
  const isBoolean = sampleStrings.every((v) =>
    booleanPatterns.includes(v.toLowerCase())
  );
  if (isBoolean) {
    return 'boolean';
  }

  // Vérifier si ce sont des dates
  const datePatterns = [
    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/,           // YYYY-MM-DD ou YYYY/MM/DD
    /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/,           // DD-MM-YYYY ou DD/MM/YYYY
    /^\d{1,2}[-/]\d{1,2}[-/]\d{2}$/,           // DD-MM-YY
    /^\d{4}[-/]\d{1,2}[-/]\d{1,2}\s\d{1,2}:\d{2}/, // Avec heure
  ];
  const isDate = sampleStrings.every((v) =>
    datePatterns.some((pattern) => pattern.test(v))
  );
  if (isDate) {
    return 'datetime';
  }

  // Vérifier si ce sont des pourcentages
  const isPercentage = sampleStrings.every((v) => v.endsWith('%'));
  if (isPercentage) {
    return 'percentage';
  }

  // Vérifier si ce sont des devises
  const currencyPatterns = [
    /^[\d\s,.]+\s*(FCFA|XOF|XAF|EUR|USD|€|\$|CFA)$/i,
    /^(FCFA|XOF|XAF|EUR|USD|€|\$|CFA)\s*[\d\s,.]+$/i,
    /^[\d\s,]+\s*(F|fr|FR|Fr)$/i,
  ];
  const isCurrency = sampleStrings.some((v) =>
    currencyPatterns.some((pattern) => pattern.test(v))
  );
  if (isCurrency) {
    return 'currency';
  }

  // Vérifier si ce sont des nombres
  const numericPattern = /^-?[\d\s,.]+$/;
  const numericCount = sampleStrings.filter((v) => numericPattern.test(v)).length;
  if (numericCount / sampleStrings.length > 0.8) {
    return 'numeric';
  }

  // Vérifier si ce sont des données géographiques
  const geoPatterns = [
    /^(Senegal|Sénégal|Mali|Burkina|Niger|Togo|Bénin|Benin|Côte.d.Ivoire|Ivory.Coast|Guinée|Guinea|Mauritanie|Cameroun|Cameroon|Congo|Gabon|Tchad|Chad|RCA|Centrafrique)$/i,
    /^(Dakar|Bamako|Ouagadougou|Niamey|Lomé|Cotonou|Abidjan|Conakry|Nouakchott|Yaoundé|Douala|Brazzaville|Libreville|N.Djamena|Bangui)$/i,
  ];
  const isGeo = sampleStrings.every((v) =>
    geoPatterns.some((pattern) => pattern.test(v))
  );
  if (isGeo) {
    return 'geo';
  }

  // Vérifier si c'est une catégorie (valeurs uniques limitées)
  const uniqueValues = new Set(sampleStrings);
  if (uniqueValues.size <= Math.min(20, sampleStrings.length * 0.3)) {
    return 'category';
  }

  // Vérifier si c'est un ID (longueur fixe, caractères alphanumériques)
  const isId = sampleStrings.every((v) => /^[A-Za-z0-9_-]{5,50}$/.test(v));
  if (isId && uniqueValues.size === sampleStrings.length) {
    return 'id';
  }

  // Par défaut: texte
  return 'text';
}

/**
 * Calcule les statistiques de base pour une colonne numérique
 */
export function calculateStatistics(
  values: (string | number | boolean | null | undefined)[]
): ColumnMetadata['statistics'] {
  const numbers = values
    .filter((v) => v !== null && v !== undefined && v !== '')
    .map((v) => {
      const num = parseFloat(String(v).replace(/[^\d.-]/g, ''));
      return isNaN(num) ? null : num;
    })
    .filter((v): v is number => v !== null);

  if (numbers.length === 0) {
    return {
      count: values.length,
      nullCount: values.length,
    };
  }

  const sorted = [...numbers].sort((a, b) => a - b);
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  const mean = sum / numbers.length;

  // Médiane
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: Math.round(mean * 100) / 100,
    median,
    sum: Math.round(sum * 100) / 100,
    count: values.length,
    nullCount: values.length - numbers.length,
    uniqueCount: new Set(numbers).size,
  };
}

/**
 * Extrait les métadonnées de toutes les colonnes
 */
export function extractColumnMetadata(
  data: Record<string, unknown>[],
  headers: string[]
): ColumnMetadata[] {
  return headers.map((header, index) => {
    const values = data.map((row) => row[header]);
    const nonNullValues = values.filter(
      (v) => v !== null && v !== undefined && v !== ''
    );

    // Détecter le type
    const dataType = detectDataType(values);

    // Valeurs uniques (pour les catégories)
    const uniqueValues =
      dataType === 'category'
        ? [...new Set(nonNullValues.map((v) => String(v)))].slice(0, 50)
        : undefined;

    // Statistiques pour les colonnes numériques
    const statistics =
      dataType === 'numeric' ||
      dataType === 'currency' ||
      dataType === 'percentage'
        ? calculateStatistics(values)
        : {
            count: values.length,
            nullCount: values.length - nonNullValues.length,
            uniqueCount: uniqueValues?.length,
          };

    // Score de qualité
    const qualityScore = Math.round(
      ((nonNullValues.length / values.length) * 100)
    );

    // Exemples de valeurs
    const sampleValues = nonNullValues.slice(0, 5).map((v) => {
      if (typeof v === 'string') return v;
      if (typeof v === 'number') return v;
      if (typeof v === 'boolean') return v;
      return String(v);
    });

    return {
      name: header,
      originalName: header,
      cleanName: header,
      dataType,
      description: '', // Sera rempli par l'IA
      statistics,
      sampleValues,
      uniqueValues,
      qualityScore,
      isSuggestedForVisualization: dataType !== 'text' && dataType !== 'id',
    };
  });
}

/**
 * Valide un fichier avant upload
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Vérifier la taille (max 10MB par défaut)
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '10485760', 10);
  if (file.size > maxSize) {
    errors.push(
      `Le fichier est trop volumineux (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum autorisé: ${(maxSize / 1024 / 1024).toFixed(0)} MB.`
    );
  }

  // Vérifier l'extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!['csv', 'xlsx', 'xls', 'json', 'parquet'].includes(extension || '')) {
    errors.push(
      `Format de fichier non supporté (.${extension}). Formats acceptés: CSV, XLSX, XLS, JSON, Parquet.`
    );
  }

  // Si des erreurs, retourner immédiatement
  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      warnings,
      rowCount: 0,
      columnCount: 0,
      detectedEncoding: '',
    };
  }

  // Parser le fichier pour validation complète
  const result = await parseFile(file, { maxRows: 1000 });

  if (!result.success) {
    return {
      isValid: false,
      errors: result.errors,
      warnings: result.warnings,
      rowCount: 0,
      columnCount: 0,
      detectedEncoding: '',
    };
  }

  // Vérifications supplémentaires
  if (result.rowCount === 0) {
    errors.push('Le fichier est vide.');
  }

  if (result.columnCount < 2) {
    warnings.push(
      'Le fichier ne contient qu\'une seule colonne. Un dashboard nécessite généralement plusieurs colonnes de données.'
    );
  }

  if (result.rowCount < 5) {
    warnings.push(
      'Le fichier contient très peu de lignes. L\'analyse sera limitée.'
    );
  }

  // Détecter l'encodage (approximatif)
  const detectedEncoding = 'UTF-8'; // PapaParse gère automatiquement

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [...warnings, ...result.warnings],
    rowCount: result.rowCount,
    columnCount: result.columnCount,
    detectedEncoding,
  };
}

/**
 * Parse un champ JSON de manière sécurisée
 * Retourne une valeur par défaut si le parsing échoue
 */
export function parseJsonField<T>(
  value: string | null | undefined,
  defaultValue: T
): T {
  if (!value) return defaultValue;
  
  try {
    return JSON.parse(value) as T;
  } catch {
    console.error('Erreur parsing JSON:', value);
    return defaultValue;
  }
}
