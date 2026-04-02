/**
 * InsightGov Africa - Natural Language Query Component
 * =====================================================
 * Interface pour poser des questions en langage naturel sur les données.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Sparkles,
  Loader2,
  Lightbulb,
  BarChart3,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  History,
} from 'lucide-react';
import type { ColumnMetadata, DashboardConfig } from '@/types';

interface QueryResult {
  success: boolean;
  query: string;
  interpretation?: {
    intent: string;
    entities: Array<{ type: string; value: string; confidence: number }>;
  };
  result?: {
    type: string;
    data: unknown;
    insights?: string[];
  };
  chartConfig?: {
    type: string;
    title: string;
    data: Record<string, unknown>[];
  };
  explanation: string;
  suggestions: string[];
}

interface NaturalLanguageQueryProps {
  data: Record<string, unknown>[];
  columns: ColumnMetadata[];
  config?: DashboardConfig;
  onResult?: (result: QueryResult) => void;
}

export function NaturalLanguageQuery({
  data,
  columns,
  config,
  onResult,
}: NaturalLanguageQueryProps) {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load initial suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const response = await fetch(
          `/api/ai/query?columns=${encodeURIComponent(JSON.stringify(columns))}`
        );
        const data = await response.json();
        if (data.success) {
          setSuggestions(data.suggestions.slice(0, 5));
        }
      } catch (err) {
        console.error('Erreur chargement suggestions:', err);
      }
    };

    if (columns.length > 0) {
      loadSuggestions();
    }
  }, [columns]);

  // Execute query
  const executeQuery = useCallback(async (queryText: string) => {
    if (!queryText.trim() || data.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          data: data.slice(0, 1000), // Limit for performance
          columns,
          config,
        }),
      });

      const resultData = await response.json();

      if (resultData.success) {
        setResult(resultData.result);
        setHistory(prev => [queryText, ...prev.filter(q => q !== queryText)].slice(0, 10));
        setSuggestions(resultData.result.suggestions.slice(0, 5));
        onResult?.(resultData.result);
      } else {
        setError(resultData.error || 'Erreur lors de l\'exécution de la requête');
      }
    } catch (err) {
      setError('Impossible d\'exécuter la requête. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  }, [data, columns, config, onResult]);

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeQuery(query);
  };

  // Get intent icon
  const getIntentIcon = (intent?: string) => {
    switch (intent) {
      case 'aggregate':
        return <BarChart3 className="w-4 h-4" />;
      case 'trend':
        return <TrendingUp className="w-4 h-4" />;
      case 'anomaly':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Lightbulb className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Query Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-primary" />
            Assistant IA
          </CardTitle>
          <CardDescription>
            Posez une question sur vos données en langage naturel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Quel est le total des ventes par région ?"
                className="pr-20"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1 top-1"
                disabled={isLoading || !query.trim()}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Quick Suggestions */}
            {suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500">Suggestions:</span>
                {suggestions.map((suggestion, i) => (
                  <Button
                    key={i}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setQuery(suggestion);
                      executeQuery(suggestion);
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getIntentIcon(result.interpretation?.intent)}
                <CardTitle className="text-base">{result.query}</CardTitle>
              </div>
              <Badge variant="outline">
                {result.interpretation?.intent || 'resultat'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {/* Explanation */}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {result.explanation}
            </p>

            {/* Insights */}
            {result.result?.insights && result.result.insights.length > 0 && (
              <div className="mb-4 space-y-2">
                <h4 className="font-medium text-sm">Insights:</h4>
                <ul className="space-y-1">
                  {result.result.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Data Table Preview */}
            {result.result?.type === 'table' && Array.isArray(result.result.data) && (
              <div className="mt-4">
                <h4 className="font-medium text-sm mb-2">
                  Données ({result.result.data.length} lignes)
                </h4>
                <ScrollArea className="h-[200px] rounded border">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                      <tr>
                        {result.result.columns?.map((col: string) => (
                          <th key={col} className="px-3 py-2 text-left font-medium">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.result.data.slice(0, 20).map((row: Record<string, unknown>, i: number) => (
                        <tr key={i} className="border-t">
                          {result.result.columns?.map((col: string) => (
                            <td key={col} className="px-3 py-2">
                              {String(row[col] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>
            )}

            {/* Single Value */}
            {result.result?.type === 'value' && (
              <div className="bg-primary/10 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-primary">
                  {typeof result.result.data === 'number'
                    ? result.result.data.toLocaleString('fr-FR')
                    : result.result.data}
                </div>
              </div>
            )}

            {/* Next Suggestions */}
            {result.suggestions.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-sm mb-2">Questions suivantes:</h4>
                <div className="flex flex-wrap gap-2">
                  {result.suggestions.slice(0, 4).map((suggestion, i) => (
                    <Button
                      key={i}
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        setQuery(suggestion);
                        executeQuery(suggestion);
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && !result && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <History className="w-4 h-4" />
              Historique
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="space-y-1">
              {history.slice(0, 5).map((h, i) => (
                <button
                  key={i}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded truncate"
                  onClick={() => {
                    setQuery(h);
                    executeQuery(h);
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default NaturalLanguageQuery;
