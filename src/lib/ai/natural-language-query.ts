/**
 * InsightGov Africa - Natural Language Query Engine
 * ==================================================
 * Moteur de requêtes en langage naturel.
 * Permet aux utilisateurs de poser des questions sur leurs données.
 */

import { getOpenAIClient } from './openai';
import type { ColumnMetadata } from '@/types';

// =============================================================================
// TYPES
// =============================================================================

export interface QueryResult {
  success: boolean;
  query: string;
  interpretation: QueryInterpretation;
  result?: {
    type: 'value' | 'table' | 'chart' | 'comparison' | 'trend' | 'text';
    data: unknown;
    columns?: string[];
    insights?: string[];
  };
  chartConfig?: {
    type: 'bar' | 'line' | 'pie' | 'donut' | 'table' | 'metric';
    title: string;
    xAxis?: string;
    yAxis?: string;
    data: Record<string, unknown>[];
  };
  explanation: string;
  suggestions: string[];
  executionTime: number;
}

export interface QueryInterpretation {
  intent: 'aggregate' | 'filter' | 'compare' | 'trend' | 'ranking' | 'detail' | 'explain';
  entities: {
    type: 'column' | 'value' | 'time_period' | 'aggregation' | 'comparison';
    value: string;
    confidence: number;
  }[];
  filters: {
    column: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
    value: string | number | (string | number)[];
  }[];
  aggregations: {
    column: string;
    function: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'count_distinct';
  }[];
  groupBy?: string[];
  sortBy?: {
    column: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
}

export interface QuerySuggestion {
  query: string;
  category: string;
  description: string;
}

// =============================================================================
// QUERY INTERPRETATION
// =============================================================================

/**
 * Interprète une requête en langage naturel
 */
export async function interpretQuery(
  query: string,
  columns: ColumnMetadata[],
  sampleData: Record<string, unknown>[]
): Promise<QueryInterpretation> {
  const columnNames = columns.map(c => c.cleanName);
  const columnTypes = Object.fromEntries(columns.map(c => [c.cleanName, c.dataType]));

  // Build context for AI
  const context = {
    columns: columnNames,
    columnTypes,
    sampleValues: Object.fromEntries(
      columns.slice(0, 10).map(c => [c.cleanName, c.sampleValues.slice(0, 3)])
    ),
    rowExample: sampleData[0],
  };

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en analyse de données. Interprète les requêtes en langage naturel et retourne une structure JSON.

Types d'intention possibles:
- aggregate: calculer une agrégation (somme, moyenne, count)
- filter: filtrer les données
- compare: comparer des valeurs ou périodes
- trend: analyser une tendance
- ranking: classer des éléments
- detail: afficher des détails
- explain: expliquer une métrique

Opérateurs de filtre: eq, neq, gt, lt, gte, lte, contains, in

Fonctions d'agrégation: sum, avg, count, min, max, count_distinct

Réponds UNIQUEMENT en JSON sans markdown:
{
  "intent": "type d'intention",
  "entities": [{"type": "column|value|time_period|aggregation|comparison", "value": "...", "confidence": 0.0-1.0}],
  "filters": [{"column": "...", "operator": "...", "value": "..."}],
  "aggregations": [{"column": "...", "function": "..."}],
  "groupBy": ["colonne"],
  "sortBy": {"column": "...", "direction": "asc|desc"},
  "limit": nombre
}`,
        },
        {
          role: 'user',
          content: `Requête: "${query}"

Contexte des données:
${JSON.stringify(context, null, 2)}

Interprète cette requête.`,
        },
      ],
      temperature: 0.1,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content) as QueryInterpretation;
    }
  } catch (error) {
    console.error('Erreur interprétation requête:', error);
  }

  // Fallback interpretation
  return {
    intent: 'aggregate',
    entities: [],
    filters: [],
    aggregations: [],
  };
}

// =============================================================================
// QUERY EXECUTION
// =============================================================================

/**
 * Exécute une requête interprétée sur les données
 */
export async function executeNaturalLanguageQuery(
  query: string,
  data: Record<string, unknown>[],
  columns: ColumnMetadata[]
): Promise<QueryResult> {
  const startTime = Date.now();

  // Interpret the query
  const interpretation = await interpretQuery(query, columns, data.slice(0, 5));

  // Execute based on intent
  let result: QueryResult['result'];
  let chartConfig: QueryResult['chartConfig'];
  let explanation = '';

  try {
    switch (interpretation.intent) {
      case 'aggregate':
        result = executeAggregation(data, interpretation);
        chartConfig = createAggregationChartConfig(result, interpretation);
        explanation = generateAggregationExplanation(interpretation, result);
        break;

      case 'filter':
        result = executeFilter(data, interpretation);
        chartConfig = {
          type: 'table',
          title: `Résultats pour: ${query}`,
          data: result.data as Record<string, unknown>[],
        };
        explanation = `Filtré ${Array.isArray(result.data) ? result.data.length : 0} enregistrements correspondant à vos critères.`;
        break;

      case 'compare':
        result = executeComparison(data, interpretation);
        chartConfig = createComparisonChartConfig(result, interpretation);
        explanation = generateComparisonExplanation(interpretation, result);
        break;

      case 'trend':
        result = executeTrend(data, interpretation);
        chartConfig = {
          type: 'line',
          title: `Évolution: ${interpretation.entities[0]?.value || 'données'}`,
          xAxis: interpretation.groupBy?.[0] || 'index',
          yAxis: interpretation.aggregations[0]?.column || '',
          data: result.data as Record<string, unknown>[],
        };
        explanation = generateTrendExplanation(interpretation, result);
        break;

      case 'ranking':
        result = executeRanking(data, interpretation);
        chartConfig = {
          type: 'bar',
          title: `Classement: ${interpretation.aggregations[0]?.column || 'valeurs'}`,
          xAxis: interpretation.groupBy?.[0] || 'catégorie',
          yAxis: interpretation.aggregations[0]?.column || 'valeur',
          data: result.data as Record<string, unknown>[],
        };
        explanation = generateRankingExplanation(interpretation, result);
        break;

      case 'detail':
        result = executeDetail(data, interpretation);
        chartConfig = {
          type: 'table',
          title: 'Détails',
          data: result.data as Record<string, unknown>[],
        };
        explanation = `Affichage des détails demandés.`;
        break;

      case 'explain':
        result = await executeExplain(data, interpretation, query, columns);
        explanation = (result?.data as string) || 'Explication générée';
        break;

      default:
        result = {
          type: 'text',
          data: 'Impossible d\'interpréter cette requête. Essayez de la reformuler.',
        };
        explanation = 'Requête non reconnue.';
    }
  } catch (error) {
    result = {
      type: 'text',
      data: `Erreur lors de l'exécution: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
    };
    explanation = 'Une erreur est survenue lors du traitement de votre requête.';
  }

  // Generate suggestions
  const suggestions = await generateQuerySuggestions(columns, query);

  return {
    success: true,
    query,
    interpretation,
    result,
    chartConfig,
    explanation,
    suggestions,
    executionTime: Date.now() - startTime,
  };
}

// =============================================================================
// EXECUTION FUNCTIONS
// =============================================================================

function executeAggregation(
  data: Record<string, unknown>[],
  interpretation: QueryInterpretation
): QueryResult['result'] {
  let filteredData = applyFilters(data, interpretation.filters);

  const results: Record<string, unknown>[] = [];
  const agg = interpretation.aggregations[0];

  if (!agg) {
    return { type: 'value', data: filteredData.length };
  }

  if (interpretation.groupBy && interpretation.groupBy.length > 0) {
    // Group by and aggregate
    const groups: Record<string, number[]> = {};

    for (const row of filteredData) {
      const key = String(interpretation.groupBy.map(col => row[col]).join('_'));
      const value = parseFloat(String(row[agg.column])) || 0;

      if (!groups[key]) groups[key] = [];
      groups[key].push(value);
    }

    for (const [key, values] of Object.entries(groups)) {
      const aggregatedValue = applyAggregationFunction(values, agg.function);
      results.push({
        [interpretation.groupBy[0]]: key,
        [agg.column]: aggregatedValue,
      });
    }
  } else {
    // Simple aggregation
    const values = filteredData
      .map(row => parseFloat(String(row[agg.column])))
      .filter(v => !isNaN(v));

    const aggregatedValue = applyAggregationFunction(values, agg.function);
    return { type: 'value', data: aggregatedValue };
  }

  // Sort if needed
  if (interpretation.sortBy) {
    results.sort((a, b) => {
      const aVal = a[interpretation.sortBy!.column];
      const bVal = b[interpretation.sortBy!.column];
      const comparison = (aVal as number) - (bVal as number);
      return interpretation.sortBy!.direction === 'desc' ? -comparison : comparison;
    });
  }

  // Limit if needed
  const limitedResults = interpretation.limit
    ? results.slice(0, interpretation.limit)
    : results;

  return {
    type: 'table',
    data: limitedResults,
    columns: interpretation.groupBy?.concat([agg.column]) || [agg.column],
  };
}

function executeFilter(
  data: Record<string, unknown>[],
  interpretation: QueryInterpretation
): QueryResult['result'] {
  const filteredData = applyFilters(data, interpretation.filters);

  return {
    type: 'table',
    data: interpretation.limit ? filteredData.slice(0, interpretation.limit) : filteredData,
    columns: Object.keys(filteredData[0] || {}),
  };
}

function executeComparison(
  data: Record<string, unknown>[],
  interpretation: QueryInterpretation
): QueryResult['result'] {
  // Group data for comparison
  const groupCol = interpretation.groupBy?.[0];
  if (!groupCol) {
    return { type: 'text', data: 'Colonne de regroupement non spécifiée pour la comparaison' };
  }

  const groups: Record<string, Record<string, unknown>[]> = {};
  for (const row of data) {
    const key = String(row[groupCol]);
    if (!groups[key]) groups[key] = [];
    groups[key].push(row);
  }

  const results: Record<string, unknown>[] = [];
  const agg = interpretation.aggregations[0];

  for (const [key, rows] of Object.entries(groups)) {
    const values = rows
      .map(r => parseFloat(String(r[agg?.column || ''])))
      .filter(v => !isNaN(v));

    results.push({
      [groupCol]: key,
      value: agg ? applyAggregationFunction(values, agg.function) : rows.length,
      count: rows.length,
    });
  }

  // Calculate comparison metrics
  if (results.length >= 2) {
    const sorted = results.sort((a, b) => ((b.value as number) || 0) - ((a.value as number) || 0));
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    const diff = ((top.value as number) || 0) - ((bottom.value as number) || 0);
    const percentDiff = ((bottom.value as number) || 0) > 0
      ? (diff / ((bottom.value as number) || 1)) * 100
      : 0;

    return {
      type: 'comparison',
      data: sorted,
      insights: [
        `${top[groupCol]} est en tête avec ${top.value}`,
        `${bottom[groupCol]} est dernier avec ${bottom.value}`,
        `Écart de ${percentDiff.toFixed(1)}% entre le premier et le dernier`,
      ],
    };
  }

  return { type: 'table', data: results };
}

function executeTrend(
  data: Record<string, unknown>[],
  interpretation: QueryInterpretation
): QueryResult['result'] {
  const timeCol = interpretation.groupBy?.[0];
  const valueCol = interpretation.aggregations[0]?.column;

  if (!timeCol || !valueCol) {
    return { type: 'text', data: 'Colonnes de temps et de valeur requises pour l\'analyse de tendance' };
  }

  // Group by time period
  const timeGroups: Record<string, number[]> = {};
  for (const row of data) {
    const time = String(row[timeCol]);
    const value = parseFloat(String(row[valueCol]));
    if (!isNaN(value)) {
      if (!timeGroups[time]) timeGroups[time] = [];
      timeGroups[time].push(value);
    }
  }

  // Aggregate by period
  const results: Record<string, unknown>[] = Object.entries(timeGroups)
    .map(([time, values]) => ({
      [timeCol]: time,
      [valueCol]: values.reduce((a, b) => a + b, 0) / values.length,
    }))
    .sort((a, b) => String(a[timeCol]).localeCompare(String(b[timeCol])));

  // Calculate trend
  if (results.length >= 2) {
    const values = results.map(r => r[valueCol] as number);
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;

    return {
      type: 'trend',
      data: results,
      insights: [
        change > 0
          ? `Tendance haussière de ${change.toFixed(1)}% sur la période`
          : change < 0
          ? `Tendance baissière de ${Math.abs(change).toFixed(1)}% sur la période`
          : 'Tendance stable sur la période',
      ],
    };
  }

  return { type: 'table', data: results };
}

function executeRanking(
  data: Record<string, unknown>[],
  interpretation: QueryInterpretation
): QueryResult['result'] {
  const groupCol = interpretation.groupBy?.[0];
  const valueCol = interpretation.aggregations[0]?.column;

  if (!groupCol) {
    return { type: 'text', data: 'Colonne de regroupement requise pour le classement' };
  }

  // Aggregate by group
  const groups: Record<string, number> = {};
  for (const row of data) {
    const key = String(row[groupCol]);
    const value = valueCol ? parseFloat(String(row[valueCol])) : 1;
    if (!isNaN(value)) {
      groups[key] = (groups[key] || 0) + value;
    }
  }

  // Sort and rank
  const results: Record<string, unknown>[] = Object.entries(groups)
    .map(([key, value], index) => ({
      rank: index + 1,
      [groupCol]: key,
      [valueCol || 'valeur']: value,
    }))
    .sort((a, b) => ((b[valueCol || 'valeur'] as number) || 0) - ((a[valueCol || 'valeur'] as number) || 0))
    .slice(0, interpretation.limit || 10);

  return {
    type: 'table',
    data: results,
    columns: ['rank', groupCol, valueCol || 'valeur'],
  };
}

function executeDetail(
  data: Record<string, unknown>[],
  interpretation: QueryInterpretation
): QueryResult['result'] {
  const filteredData = applyFilters(data, interpretation.filters);

  return {
    type: 'table',
    data: filteredData.slice(0, interpretation.limit || 20),
    columns: Object.keys(filteredData[0] || {}),
  };
}

async function executeExplain(
  data: Record<string, unknown>[],
  interpretation: QueryInterpretation,
  query: string,
  columns: ColumnMetadata[]
): Promise<QueryResult['result']> {
  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Tu es un expert en analyse de données pour les organisations africaines. Explique de manière claire et professionnelle.',
        },
        {
          role: 'user',
          content: `Question: "${query}"

Statistiques des données:
- Nombre de lignes: ${data.length}
- Colonnes: ${columns.map(c => `${c.cleanName} (${c.dataType})`).join(', ')}

Fournis une explication claire et des insights pertinents en 2-3 paragraphes.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    return {
      type: 'text',
      data: response.choices[0]?.message?.content || 'Explication non disponible',
    };
  } catch {
    return {
      type: 'text',
      data: 'Impossible de générer une explication pour le moment.',
    };
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function applyFilters(
  data: Record<string, unknown>[],
  filters: QueryInterpretation['filters']
): Record<string, unknown>[] {
  if (!filters || filters.length === 0) return data;

  return data.filter(row => {
    return filters.every(filter => {
      const value = row[filter.column];
      const filterValue = filter.value;

      switch (filter.operator) {
        case 'eq':
          return String(value).toLowerCase() === String(filterValue).toLowerCase();
        case 'neq':
          return String(value).toLowerCase() !== String(filterValue).toLowerCase();
        case 'gt':
          return parseFloat(String(value)) > parseFloat(String(filterValue));
        case 'lt':
          return parseFloat(String(value)) < parseFloat(String(filterValue));
        case 'gte':
          return parseFloat(String(value)) >= parseFloat(String(filterValue));
        case 'lte':
          return parseFloat(String(value)) <= parseFloat(String(filterValue));
        case 'contains':
          return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
        case 'in':
          if (Array.isArray(filterValue)) {
            return filterValue.map(v => String(v).toLowerCase()).includes(String(value).toLowerCase());
          }
          return false;
        default:
          return true;
      }
    });
  });
}

function applyAggregationFunction(values: number[], func: string): number {
  if (values.length === 0) return 0;

  switch (func) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'count':
      return values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'count_distinct':
      return new Set(values).size;
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

// =============================================================================
// CHART CONFIG GENERATORS
// =============================================================================

function createAggregationChartConfig(
  result: QueryResult['result'],
  interpretation: QueryInterpretation
): QueryResult['chartConfig'] {
  if (result?.type === 'value') {
    return {
      type: 'metric',
      title: interpretation.aggregations[0]?.column || 'Résultat',
      data: [{ value: result.data }],
    };
  }

  const groupCol = interpretation.groupBy?.[0] || 'catégorie';
  const valueCol = interpretation.aggregations[0]?.column || 'valeur';

  return {
    type: 'bar',
    title: `${interpretation.aggregations[0]?.function || 'somme'} de ${valueCol} par ${groupCol}`,
    xAxis: groupCol,
    yAxis: valueCol,
    data: result?.data as Record<string, unknown>[],
  };
}

function createComparisonChartConfig(
  result: QueryResult['result'],
  interpretation: QueryInterpretation
): QueryResult['chartConfig'] {
  const groupCol = interpretation.groupBy?.[0] || 'catégorie';

  return {
    type: 'bar',
    title: `Comparaison par ${groupCol}`,
    xAxis: groupCol,
    yAxis: 'value',
    data: result?.data as Record<string, unknown>[],
  };
}

// =============================================================================
// EXPLANATION GENERATORS
// =============================================================================

function generateAggregationExplanation(
  interpretation: QueryInterpretation,
  result: QueryResult['result']
): string {
  const agg = interpretation.aggregations[0];
  if (!agg) return 'Calcul effectué.';

  const funcNames: Record<string, string> = {
    sum: 'Somme totale',
    avg: 'Moyenne',
    count: 'Nombre',
    min: 'Minimum',
    max: 'Maximum',
    count_distinct: 'Nombre de valeurs uniques',
  };

  if (result?.type === 'value') {
    return `${funcNames[agg.function] || 'Résultat'} de ${agg.column}: ${result.data}`;
  }

  return `${funcNames[agg.function] || 'Calcul'} de ${agg.column}` +
    (interpretation.groupBy ? ` regroupé par ${interpretation.groupBy.join(', ')}` : '');
}

function generateComparisonExplanation(
  interpretation: QueryInterpretation,
  result: QueryResult['result']
): string {
  const insights = result?.insights || [];
  return insights.length > 0
    ? insights.join('. ')
    : 'Comparaison effectuée. Les résultats montrent les différences entre les groupes.';
}

function generateTrendExplanation(
  interpretation: QueryInterpretation,
  result: QueryResult['result']
): string {
  const insights = result?.insights || [];
  return insights.length > 0
    ? insights.join('. ')
    : 'Analyse de tendance effectuée sur la période.';
}

function generateRankingExplanation(
  interpretation: QueryInterpretation,
  result: QueryResult['result']
): string {
  const data = result?.data as Record<string, unknown>[];
  if (!data || data.length === 0) return 'Classement non disponible.';

  const top = data[0];
  const groupCol = interpretation.groupBy?.[0] || 'catégorie';
  return `Top ${data.length}: ${top[groupCol]} en première position.`;
}

// =============================================================================
// SUGGESTIONS GENERATOR
// =============================================================================

export async function generateQuerySuggestions(
  columns: ColumnMetadata[],
  currentQuery: string
): Promise<string[]> {
  const suggestions: string[] = [];

  // Get numeric and categorical columns
  const numericCols = columns.filter(c => c.dataType === 'numeric' || c.dataType === 'currency');
  const categoryCols = columns.filter(c => c.dataType === 'category' || c.dataType === 'text');
  const dateCols = columns.filter(c => c.dataType === 'date');

  // Add generic suggestions
  if (numericCols.length > 0) {
    suggestions.push(`Total de ${numericCols[0].cleanName}`);
    suggestions.push(`Moyenne de ${numericCols[0].cleanName}`);
  }

  if (categoryCols.length > 0 && numericCols.length > 0) {
    suggestions.push(`${numericCols[0].cleanName} par ${categoryCols[0].cleanName}`);
  }

  if (dateCols.length > 0 && numericCols.length > 0) {
    suggestions.push(`Évolution de ${numericCols[0].cleanName} dans le temps`);
  }

  if (categoryCols.length > 0) {
    suggestions.push(`Top 10 ${categoryCols[0].cleanName}`);
  }

  // AI-powered contextual suggestions
  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Génère 3 suggestions de questions pertinentes basées sur les colonnes disponibles. Réponds avec un tableau JSON de strings.',
        },
        {
          role: 'user',
          content: `Colonnes: ${columns.map(c => `${c.cleanName} (${c.dataType})`).join(', ')}

Question actuelle: "${currentQuery}"

Génère 3 suggestions de questions similaires ou complémentaires.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
        suggestions.push(...parsed.suggestions);
      }
    }
  } catch (error) {
    console.error('Erreur génération suggestions:', error);
  }

  return [...new Set(suggestions)].slice(0, 8);
}

export default {
  interpretQuery,
  executeNaturalLanguageQuery,
  generateQuerySuggestions,
};
