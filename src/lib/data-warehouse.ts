/**
 * InsightGov Africa - Data Warehouse Service
 * ===========================================
 * Service de transformation des données en schéma en étoile (Star Schema).
 * Transforme les données brutes en dimension et tables de faits.
 */

import { db } from '@/lib/db';
import type {
  ColumnMetadata,
  TransformOptions,
  StarSchemaTransformResult,
  DimTimeRecord,
  DimGeographyRecord,
  FilterState,
  AggregatedData,
  MultiYearResult,
} from '@/types';

// =============================================================================
// CONSTANTES
// =============================================================================

const MONTH_NAMES_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAY_NAMES_FR = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
];

// Codes ISO pays d'Afrique de l'Ouest
const WEST_AFRICA_COUNTRY_CODES: Record<string, string> = {
  'guinée': 'GN',
  'guinea': 'GN',
  'sénégal': 'SN',
  'senegal': 'SN',
  'mali': 'ML',
  'burkina faso': 'BF',
  'burkina': 'BF',
  'niger': 'NE',
  'côte d\'ivoire': 'CI',
  'cote d\'ivoire': 'CI',
  'ivory coast': 'CI',
  'togo': 'TG',
  'bénin': 'BJ',
  'benin': 'BJ',
  'sierra leone': 'SL',
  'libéria': 'LR',
  'liberia': 'LR',
  'mauritanie': 'MR',
  'mauritania': 'MR',
  'gambie': 'GM',
  'gambia': 'GM',
  'cap-vert': 'CV',
  'cape verde': 'CV',
  'ghana': 'GH',
  'nigeria': 'NG',
  'cameroun': 'CM',
  'cameroon': 'CM',
};

// =============================================================================
// DIMENSION TIME FUNCTIONS
// =============================================================================

/**
 * Génère ou récupère un enregistrement de dimension temps
 */
export async function getOrCreateDimTime(date: Date): Promise<string> {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  const period = `${year}-${String(month).padStart(2, '0')}`;
  
  // Vérifier si l'enregistrement existe déjà
  const existing = await db.dimTime.findUnique({
    where: { date },
  });
  
  if (existing) {
    return existing.id;
  }
  
  // Créer un nouvel enregistrement
  const dayOfWeek = date.getDay(); // 0-6 (Dimanche-Samedi)
  const week = getWeekNumber(date);
  const quarter = Math.ceil(month / 3);
  
  const dimTime = await db.dimTime.create({
    data: {
      date,
      year,
      quarter,
      month,
      monthName: MONTH_NAMES_FR[month - 1],
      week,
      dayOfWeek: dayOfWeek === 0 ? 7 : dayOfWeek, // 1-7 (Lundi-Dimanche)
      dayName: DAY_NAMES_FR[dayOfWeek],
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      period,
    },
  });
  
  return dimTime.id;
}

/**
 * Obtient le numéro de semaine d'une date
 */
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

/**
 * Génère toutes les dates d'une année pour la dimension temps
 */
export async function generateYearTimeDimension(year: number): Promise<number> {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  let count = 0;
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    try {
      await getOrCreateDimTime(new Date(d));
      count++;
    } catch (error) {
      console.error(`Erreur création dimension temps pour ${d}:`, error);
    }
  }
  
  return count;
}

// =============================================================================
// DIMENSION GEOGRAPHY FUNCTIONS
// =============================================================================

/**
 * Génère ou récupère un enregistrement de dimension géographique
 */
export async function getOrCreateDimGeography(
  country: string,
  region?: string,
  district?: string,
  city?: string
): Promise<string> {
  // Normaliser le nom du pays
  const normalizedCountry = country.trim();
  const countryCode = WEST_AFRICA_COUNTRY_CODES[normalizedCountry.toLowerCase()] || null;
  
  // Vérifier si l'enregistrement existe déjà
  const existing = await db.dimGeography.findFirst({
    where: {
      country: normalizedCountry,
      region: region || null,
      district: district || null,
      city: city || null,
    },
  });
  
  if (existing) {
    return existing.id;
  }
  
  // Déterminer le niveau
  let level = 'country';
  if (city) level = 'city';
  else if (district) level = 'district';
  else if (region) level = 'region';
  
  // Créer un nouvel enregistrement
  const dimGeography = await db.dimGeography.create({
    data: {
      country: normalizedCountry,
      countryCode,
      region: region || null,
      district: district || null,
      city: city || null,
      level,
    },
  });
  
  return dimGeography.id;
}

// =============================================================================
// DIMENSION ORGANIZATION FUNCTIONS
// =============================================================================

/**
 * Génère ou récupère un enregistrement de dimension organisationnelle
 */
export async function getOrCreateDimOrganization(
  name: string,
  type: string,
  sector?: string,
  parentOrgId?: string
): Promise<string> {
  // Vérifier si l'enregistrement existe déjà
  const existing = await db.dimOrganization.findFirst({
    where: {
      name,
      type,
      parentOrgId: parentOrgId || null,
    },
  });
  
  if (existing) {
    return existing.id;
  }
  
  // Déterminer le niveau hiérarchique
  let level = 1;
  if (parentOrgId) {
    const parent = await db.dimOrganization.findUnique({
      where: { id: parentOrgId },
    });
    if (parent) {
      level = parent.level + 1;
    }
  }
  
  // Créer un nouvel enregistrement
  const dimOrg = await db.dimOrganization.create({
    data: {
      name,
      type,
      sector: sector || null,
      parentOrgId: parentOrgId || null,
      level,
    },
  });
  
  return dimOrg.id;
}

// =============================================================================
// DIMENSION PROJECT FUNCTIONS
// =============================================================================

/**
 * Génère ou récupère un enregistrement de dimension projet
 */
export async function getOrCreateDimProject(
  name: string,
  type: string,
  sector?: string,
  donor?: string
): Promise<string> {
  // Vérifier si l'enregistrement existe déjà
  const existing = await db.dimProject.findFirst({
    where: { name },
  });
  
  if (existing) {
    return existing.id;
  }
  
  // Créer un nouvel enregistrement
  const dimProject = await db.dimProject.create({
    data: {
      name,
      type,
      sector: sector || null,
      donor: donor || null,
    },
  });
  
  return dimProject.id;
}

// =============================================================================
// DIMENSION INDICATOR FUNCTIONS
// =============================================================================

/**
 * Génère ou récupère un enregistrement de dimension indicateur
 */
export async function getOrCreateDimIndicator(
  name: string,
  category: string,
  unit?: string,
  isPercentage: boolean = false
): Promise<string> {
  // Vérifier si l'enregistrement existe déjà
  const existing = await db.dimIndicator.findFirst({
    where: { name, category },
  });
  
  if (existing) {
    return existing.id;
  }
  
  // Créer un nouvel enregistrement
  const dimIndicator = await db.dimIndicator.create({
    data: {
      name,
      category,
      unit: unit || null,
      isPercentage,
    },
  });
  
  return dimIndicator.id;
}

// =============================================================================
// DIMENSION DATA SOURCE FUNCTIONS
// =============================================================================

/**
 * Génère ou récupère un enregistrement de dimension source de données
 */
export async function getOrCreateDimDataSource(
  name: string,
  type: string,
  format: string,
  organization?: string
): Promise<string> {
  // Vérifier si l'enregistrement existe déjà
  const existing = await db.dimDataSource.findFirst({
    where: { name, type },
  });
  
  if (existing) {
    return existing.id;
  }
  
  // Créer un nouvel enregistrement
  const dimSource = await db.dimDataSource.create({
    data: {
      name,
      type,
      format,
      organization: organization || null,
    },
  });
  
  return dimSource.id;
}

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

/**
 * Détecte les colonnes de type date dans les métadonnées
 */
export function detectDateColumns(columns: ColumnMetadata[]): string[] {
  return columns
    .filter(col => 
      col.dataType === 'datetime' || 
      col.dataType === 'date' ||
      col.cleanName?.toLowerCase().includes('date') ||
      col.cleanName?.toLowerCase().includes('annee') ||
      col.cleanName?.toLowerCase().includes('année') ||
      col.cleanName?.toLowerCase().includes('mois') ||
      col.cleanName?.toLowerCase().includes('jour')
    )
    .map(col => col.cleanName || col.name);
}

/**
 * Détecte les colonnes de type géographique dans les métadonnées
 */
export function detectGeographyColumns(columns: ColumnMetadata[]): string[] {
  return columns
    .filter(col => 
      col.dataType === 'geo' ||
      col.cleanName?.toLowerCase().includes('pays') ||
      col.cleanName?.toLowerCase().includes('country') ||
      col.cleanName?.toLowerCase().includes('region') ||
      col.cleanName?.toLowerCase().includes('région') ||
      col.cleanName?.toLowerCase().includes('district') ||
      col.cleanName?.toLowerCase().includes('ville') ||
      col.cleanName?.toLowerCase().includes('city') ||
      col.cleanName?.toLowerCase().includes('localite') ||
      col.cleanName?.toLowerCase().includes('localité') ||
      col.cleanName?.toLowerCase().includes('prefecture') ||
      col.cleanName?.toLowerCase().includes('préfecture')
    )
    .map(col => col.cleanName || col.name);
}

/**
 * Détecte les colonnes de valeurs numériques dans les métadonnées
 */
export function detectValueColumns(columns: ColumnMetadata[]): string[] {
  return columns
    .filter(col => 
      col.dataType === 'numeric' ||
      col.dataType === 'currency' ||
      col.dataType === 'percentage'
    )
    .map(col => col.cleanName || col.name);
}

/**
 * Extrait une date d'une valeur
 */
function extractDateFromValue(value: unknown): Date | null {
  if (!value) return null;
  
  // Si c'est déjà une Date
  if (value instanceof Date) return value;
  
  // Si c'est un nombre (année seule ou timestamp)
  if (typeof value === 'number') {
    if (value > 1900 && value < 2100) {
      // Probablement une année
      return new Date(value, 0, 1);
    }
    // Timestamp
    return new Date(value);
  }
  
  // Si c'est une chaîne
  const strValue = String(value).trim();
  
  // Essayer différents formats
  const formats = [
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/, // YYYY/MM/DD
    /^(\d{4})$/, // Juste l'année
  ];
  
  for (const format of formats) {
    const match = strValue.match(format);
    if (match) {
      if (match.length === 2) {
        // Juste l'année
        return new Date(parseInt(match[1]), 0, 1);
      } else if (match.length === 4) {
        // Date complète
        const [, a, b, c] = match;
        // Déterminer l'ordre jour/mois/année
        if (format === formats[0] || format === formats[3]) {
          // YYYY-MM-DD ou YYYY/MM/DD
          return new Date(parseInt(a), parseInt(b) - 1, parseInt(c));
        } else {
          // DD/MM/YYYY ou DD-MM-YYYY
          return new Date(parseInt(c), parseInt(b) - 1, parseInt(a));
        }
      }
    }
  }
  
  // Essayer de parser directement
  const parsed = new Date(strValue);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  return null;
}

/**
 * Transforme les données brutes en schéma en étoile
 */
export async function transformToStarSchema(
  data: Record<string, unknown>[],
  columns: ColumnMetadata[],
  options: TransformOptions
): Promise<StarSchemaTransformResult> {
  const result: StarSchemaTransformResult = {
    success: true,
    factRecords: 0,
    timeRecords: 0,
    geographyRecords: 0,
    organizationRecords: 0,
    projectRecords: 0,
    indicatorRecords: 0,
    sourceRecords: 0,
    errors: [],
    warnings: [],
  };
  
  try {
    // Détecter les colonnes de dimensions
    const dateColumns = options.dateColumns || detectDateColumns(columns);
    const geographyColumns = options.geographyColumns || detectGeographyColumns(columns);
    const valueColumns = options.valueColumns || detectValueColumns(columns);
    
    // Créer la dimension source de données
    const sourceId = await getOrCreateDimDataSource(
      `Dataset ${options.datasetId}`,
      'file',
      'mixed',
      undefined
    );
    result.sourceRecords = 1;
    
    // Tracker les IDs de dimensions créés
    const timeIds = new Set<string>();
    const geographyIds = new Set<string>();
    
    // Traiter chaque ligne de données
    for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
      const row = data[rowIndex];
      
      let timeId: string | null = null;
      let geographyId: string | null = null;
      
      // Extraire la dimension temps
      if (dateColumns.length > 0) {
        for (const col of dateColumns) {
          const dateValue = extractDateFromValue(row[col]);
          if (dateValue) {
            try {
              timeId = await getOrCreateDimTime(dateValue);
              timeIds.add(timeId);
            } catch (error) {
              console.warn(`Erreur création dimension temps pour ligne ${rowIndex}:`, error);
            }
            break; // Utiliser la première date valide
          }
        }
      }
      
      // Extraire la dimension géographique
      if (geographyColumns.length > 0) {
        const geoValues = geographyColumns.map(col => String(row[col] || '')).filter(v => v);
        if (geoValues.length > 0) {
          try {
            // Le premier est le pays, puis région, district, ville
            geographyId = await getOrCreateDimGeography(
              geoValues[0],
              geoValues[1],
              geoValues[2],
              geoValues[3]
            );
            geographyIds.add(geographyId);
          } catch (error) {
            console.warn(`Erreur création dimension géographie pour ligne ${rowIndex}:`, error);
          }
        }
      }
      
      // Créer l'enregistrement de fait pour chaque colonne de valeur
      for (const valueCol of valueColumns) {
        const rawValue = row[valueCol];
        let numericValue: number | null = null;
        
        if (typeof rawValue === 'number') {
          numericValue = rawValue;
        } else if (rawValue) {
          const parsed = parseFloat(String(rawValue).replace(/[^\d.-]/g, ''));
          if (!isNaN(parsed)) {
            numericValue = parsed;
          }
        }
        
        if (numericValue !== null) {
          try {
            // Créer l'indicateur
            const indicatorId = await getOrCreateDimIndicator(
              valueCol,
              'metric',
              columns.find(c => c.cleanName === valueCol)?.dataType === 'percentage' ? '%' : undefined,
              columns.find(c => c.cleanName === valueCol)?.dataType === 'percentage'
            );
            
            // Créer l'enregistrement de fait
            await db.factDataRecord.create({
              data: {
                datasetId: options.datasetId,
                organizationId: options.organizationId,
                timeId,
                geographyId,
                indicatorId,
                sourceId,
                value: numericValue,
                rowNumber: rowIndex,
                rawData: JSON.stringify(row),
              },
            });
            
            result.factRecords++;
          } catch (error) {
            result.errors.push(`Erreur création fait ligne ${rowIndex}, colonne ${valueCol}: ${error}`);
          }
        }
      }
    }
    
    result.timeRecords = timeIds.size;
    result.geographyRecords = geographyIds.size;
    
    return result;
  } catch (error) {
    result.success = false;
    result.errors.push(`Erreur transformation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    return result;
  }
}

// =============================================================================
// FILTERING & AGGREGATION
// =============================================================================

/**
 * Applique les filtres aux données de la table de faits
 */
export async function getFilteredFactRecords(
  datasetId: string,
  filters: FilterState
): Promise<Record<string, unknown>[]> {
  const whereClause: Record<string, unknown> = { datasetId };
  
  // Filtre par années
  if (filters.years.length > 0) {
    whereClause.timeDim = {
      year: { in: filters.years },
    };
  }
  
  // Filtre par périodes
  if (filters.periods.length > 0) {
    whereClause.timeDim = {
      ...((whereClause.timeDim as Record<string, unknown>) || {}),
      period: { in: filters.periods },
    };
  }
  
  // Filtre par géographie
  if (filters.geographies.length > 0) {
    whereClause.geographyDim = {
      OR: [
        { country: { in: filters.geographies } },
        { region: { in: filters.geographies } },
        { district: { in: filters.geographies } },
        { city: { in: filters.geographies } },
      ],
    };
  }
  
  // Récupérer les enregistrements avec les relations
  const records = await db.factDataRecord.findMany({
    where: whereClause,
    include: {
      timeDim: true,
      geographyDim: true,
      indicatorDim: true,
    },
  });
  
  // Transformer en format plat pour le frontend
  return records.map(record => ({
    id: record.id,
    value: record.value,
    year: record.timeDim?.year,
    month: record.timeDim?.month,
    period: record.timeDim?.period,
    quarter: record.timeDim?.quarter,
    country: record.geographyDim?.country,
    region: record.geographyDim?.region,
    district: record.geographyDim?.district,
    city: record.geographyDim?.city,
    indicator: record.indicatorDim?.name,
    indicatorCategory: record.indicatorDim?.category,
    unit: record.indicatorDim?.unit,
  }));
}

/**
 * Agrège les données par dimension
 */
export async function aggregateByDimension(
  datasetId: string,
  dimension: string,
  metric: 'sum' | 'avg' | 'count' | 'min' | 'max',
  filters?: FilterState
): Promise<AggregatedData[]> {
  // Construire la requête de base
  const baseFilter: Record<string, unknown> = { datasetId };
  
  if (filters?.years?.length) {
    baseFilter.timeDim = { year: { in: filters.years } };
  }
  
  // Récupérer les données
  const records = await db.factDataRecord.findMany({
    where: baseFilter,
    include: {
      timeDim: true,
      geographyDim: true,
      indicatorDim: true,
    },
  });
  
  // Grouper par dimension
  const grouped = new Map<string, { values: number[]; count: number }>();
  
  records.forEach(record => {
    let dimensionValue: string;
    
    switch (dimension) {
      case 'year':
        dimensionValue = String(record.timeDim?.year || 'Non défini');
        break;
      case 'quarter':
        dimensionValue = `${record.timeDim?.year}-Q${record.timeDim?.quarter || '?'}`;
        break;
      case 'month':
        dimensionValue = record.timeDim?.monthName || 'Non défini';
        break;
      case 'period':
        dimensionValue = record.timeDim?.period || 'Non défini';
        break;
      case 'country':
        dimensionValue = record.geographyDim?.country || 'Non défini';
        break;
      case 'region':
        dimensionValue = record.geographyDim?.region || 'Non défini';
        break;
      case 'indicator':
        dimensionValue = record.indicatorDim?.name || 'Non défini';
        break;
      default:
        dimensionValue = 'Non défini';
    }
    
    if (record.value !== null) {
      const existing = grouped.get(dimensionValue) || { values: [], count: 0 };
      existing.values.push(record.value);
      existing.count++;
      grouped.set(dimensionValue, existing);
    }
  });
  
  // Calculer les agrégations
  const results: AggregatedData[] = [];
  let totalValue = 0;
  
  grouped.forEach((data, dimensionValue) => {
    let value: number;
    
    switch (metric) {
      case 'sum':
        value = data.values.reduce((a, b) => a + b, 0);
        break;
      case 'avg':
        value = data.values.reduce((a, b) => a + b, 0) / data.values.length;
        break;
      case 'count':
        value = data.count;
        break;
      case 'min':
        value = Math.min(...data.values);
        break;
      case 'max':
        value = Math.max(...data.values);
        break;
      default:
        value = 0;
    }
    
    totalValue += value;
    
    results.push({
      dimension,
      dimensionValue,
      metric,
      value: Math.round(value * 100) / 100,
      count: data.count,
    });
  });
  
  // Calculer les pourcentages
  results.forEach(r => {
    r.percentage = totalValue > 0 ? Math.round((r.value / totalValue) * 10000) / 100 : 0;
  });
  
  // Trier par valeur décroissante
  return results.sort((a, b) => b.value - a.value);
}

/**
 * Récupère les données multi-année pour comparaison
 */
export async function getMultiYearData(
  datasetId: string,
  indicatorName?: string,
  startYear?: number,
  endYear?: number
): Promise<MultiYearResult[]> {
  const whereClause: Record<string, unknown> = { datasetId };
  
  if (indicatorName) {
    whereClause.indicatorDim = { name: indicatorName };
  }
  
  if (startYear || endYear) {
    whereClause.timeDim = {
      year: {
        ...(startYear && { gte: startYear }),
        ...(endYear && { lte: endYear }),
      },
    };
  }
  
  const records = await db.factDataRecord.findMany({
    where: whereClause,
    include: {
      timeDim: true,
    },
  });
  
  // Grouper par année
  const yearlyData = new Map<number, { values: number[]; count: number }>();
  
  records.forEach(record => {
    if (record.timeDim && record.value !== null) {
      const year = record.timeDim.year;
      const existing = yearlyData.get(year) || { values: [], count: 0 };
      existing.values.push(record.value);
      existing.count++;
      yearlyData.set(year, existing);
    }
  });
  
  // Calculer les résultats
  const results: MultiYearResult[] = [];
  const sortedYears = Array.from(yearlyData.keys()).sort((a, b) => a - b);
  
  sortedYears.forEach((year, index) => {
    const data = yearlyData.get(year)!;
    const value = data.values.reduce((a, b) => a + b, 0);
    const count = data.count;
    
    let change: number | undefined;
    let changePercent: number | undefined;
    
    if (index > 0) {
      const prevYear = sortedYears[index - 1];
      const prevData = yearlyData.get(prevYear)!;
      const prevValue = prevData.values.reduce((a, b) => a + b, 0);
      
      change = value - prevValue;
      changePercent = prevValue !== 0 ? ((value - prevValue) / prevValue) * 100 : 0;
    }
    
    results.push({
      year,
      value: Math.round(value * 100) / 100,
      count,
      change: change !== undefined ? Math.round(change * 100) / 100 : undefined,
      changePercent: changePercent !== undefined ? Math.round(changePercent * 100) / 100 : undefined,
    });
  });
  
  return results;
}

/**
 * Obtient les années disponibles dans un dataset
 */
export async function getAvailableYears(datasetId: string): Promise<number[]> {
  const records = await db.factDataRecord.findMany({
    where: { datasetId },
    include: { timeDim: true },
  });
  
  const years = new Set<number>();
  records.forEach(record => {
    if (record.timeDim?.year) {
      years.add(record.timeDim.year);
    }
  });
  
  return Array.from(years).sort((a, b) => a - b);
}

/**
 * Obtient les périodes disponibles dans un dataset
 */
export async function getAvailablePeriods(datasetId: string): Promise<string[]> {
  const records = await db.factDataRecord.findMany({
    where: { datasetId },
    include: { timeDim: true },
  });
  
  const periods = new Set<string>();
  records.forEach(record => {
    if (record.timeDim?.period) {
      periods.add(record.timeDim.period);
    }
  });
  
  return Array.from(periods).sort();
}

/**
 * Pré-calcule les agrégations pour un dataset
 */
export async function preCalculateMetrics(datasetId: string): Promise<void> {
  const metricTypes: ('sum' | 'avg' | 'count')[] = ['sum', 'avg', 'count'];
  const dimensions = ['year', 'period', 'country', 'region', 'indicator'];
  
  for (const metricType of metricTypes) {
    for (const dimension of dimensions) {
      const aggregated = await aggregateByDimension(datasetId, dimension, metricType);
      
      for (const data of aggregated) {
        await db.preAggregatedMetric.upsert({
          where: {
            datasetId_metricType_dimension_dimensionValue_year_period: {
              datasetId,
              metricType,
              dimension,
              dimensionValue: data.dimensionValue,
              year: null,
              period: null,
            },
          },
          create: {
            datasetId,
            metricType,
            dimension,
            dimensionValue: data.dimensionValue,
            value: data.value,
            recordCount: data.count,
          },
          update: {
            value: data.value,
            recordCount: data.count,
            calculatedAt: new Date(),
          },
        });
      }
    }
  }
}
