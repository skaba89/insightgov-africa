'use client';

/**
 * InsightGov Africa - Predictive Analytics Component
 * ====================================================
 * Composant d'analyse prédictive avec prévisions et insights
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Lightbulb,
  Target,
  BarChart3,
  LineChart,
  Sparkles,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface TimeSeriesPoint {
  date: string;
  value: number;
}

interface ForecastResult {
  forecast: TimeSeriesPoint[];
  confidence: {
    lower: TimeSeriesPoint[];
    upper: TimeSeriesPoint[];
  };
  accuracy: {
    mape: number;
    rmse: number;
  };
  method: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: boolean;
}

interface TrendResult {
  trend: 'increasing' | 'decreasing' | 'stable';
  slope: number;
  r2: number;
  seasonality: {
    detected: boolean;
    period: number | null;
  };
  changePoints: {
    date: string;
    type: 'increase' | 'decrease';
    magnitude: number;
  }[];
}

interface AnomalyResult {
  anomalies: {
    date: string;
    value: number;
    expected: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
  }[];
  summary: {
    totalAnomalies: number;
    highSeverity: number;
    anomalyRate: number;
  };
}

interface Insight {
  type: 'alert' | 'opportunity' | 'recommendation';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  actionItems: string[];
}

interface PredictivePanelProps {
  data: TimeSeriesPoint[];
  context: {
    sector: string;
    metricName: string;
    organizationType: string;
  };
  onInsightClick?: (insight: Insight) => void;
  className?: string;
}

export function PredictivePanel({
  data,
  context,
  onInsightClick,
  className,
}: PredictivePanelProps) {
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState<ForecastResult | null>(null);
  const [trend, setTrend] = useState<TrendResult | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyResult | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [report, setReport] = useState<string>('');
  const [forecastHorizon, setForecastHorizon] = useState(6);

  useEffect(() => {
    runAnalysis();
  }, [data, forecastHorizon]);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'full-analysis',
          data,
          context,
          options: {
            horizon: forecastHorizon,
            sensitivity: 'medium',
          },
        }),
      });

      const result = await response.json();
      if (result.success) {
        setForecast(result.analysis.forecast);
        setTrend(result.analysis.trend);
        setAnomalies(result.analysis.anomalies);
        setInsights(result.analysis.insights);
        setReport(result.analysis.report);
      }
    } catch (error) {
      console.error('Erreur analyse:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trendType: string) => {
    switch (trendType) {
      case 'increasing':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'decreasing':
        return <TrendingDown className="w-5 h-5 text-red-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTrendColor = (trendType: string) => {
    switch (trendType) {
      case 'increasing':
        return 'text-green-600';
      case 'decreasing':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'opportunity':
        return <Lightbulb className="w-5 h-5 text-blue-500" />;
      case 'recommendation':
        return <Target className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    const variants = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-amber-100 text-amber-700',
      low: 'bg-green-100 text-green-700',
    };
    return variants[impact as keyof typeof variants] || variants.low;
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(2);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="w-6 h-6 animate-pulse text-primary" />
            <span className="text-muted-foreground">Analyse prédictive en cours...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Trend Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {trend && getTrendIcon(trend.trend)}
              <div>
                <p className="text-sm text-muted-foreground">Tendance</p>
                <p className={cn('font-semibold capitalize', trend && getTrendColor(trend.trend))}>
                  {trend?.trend === 'increasing' ? 'En hausse' :
                   trend?.trend === 'decreasing' ? 'En baisse' : 'Stable'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forecast Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <LineChart className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Prévision ({forecastHorizon} mois)</p>
                <p className="font-semibold">
                  {forecast ? formatValue(forecast.forecast[forecast.forecast.length - 1]?.value || 0) : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Anomalies Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className={cn(
                'w-5 h-5',
                anomalies && anomalies.summary.highSeverity > 0 ? 'text-red-500' : 'text-gray-400'
              )} />
              <div>
                <p className="text-sm text-muted-foreground">Anomalies</p>
                <p className="font-semibold">
                  {anomalies?.summary.totalAnomalies || 0}
                  {anomalies && anomalies.summary.highSeverity > 0 && (
                    <span className="text-red-500 text-xs ml-1">
                      ({anomalies.summary.highSeverity} critiques)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accuracy Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Précision modèle</p>
                <p className="font-semibold">
                  {forecast ? `${(100 - forecast.accuracy.mape).toFixed(1)}%` : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="insights">
        <TabsList>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <LineChart className="w-4 h-4" />
            Prévisions
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Anomalies
          </TabsTrigger>
          <TabsTrigger value="report" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Rapport
          </TabsTrigger>
        </TabsList>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4 mt-4">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Aucun insight généré
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onInsightClick?.(insight)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-muted">
                          {getInsightIcon(insight.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{insight.title}</span>
                            <Badge className={cn('text-xs', getImpactBadge(insight.impact))}>
                              {insight.impact}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {insight.description}
                          </p>
                          {insight.actionItems.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {insight.actionItems.map((action, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {action}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">Confiance</span>
                          <div className="flex items-center gap-2">
                            <Progress value={insight.confidence * 100} className="w-16 h-2" />
                            <span className="text-sm font-medium">
                              {(insight.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Prévisions</CardTitle>
                  <CardDescription>
                    Prévisions basées sur {forecast?.method}
                  </CardDescription>
                </div>
                <Select
                  value={forecastHorizon.toString()}
                  onValueChange={(v) => setForecastHorizon(parseInt(v))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 mois</SelectItem>
                    <SelectItem value="6">6 mois</SelectItem>
                    <SelectItem value="12">12 mois</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {forecast && (
                <div className="space-y-4">
                  {/* Forecast Summary */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Basse</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatValue(forecast.confidence.lower[forecast.confidence.lower.length - 1]?.value || 0)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/10">
                      <p className="text-sm text-muted-foreground">Prévision</p>
                      <p className="text-xl font-bold text-primary">
                        {formatValue(forecast.forecast[forecast.forecast.length - 1]?.value || 0)}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Haute</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatValue(forecast.confidence.upper[forecast.confidence.upper.length - 1]?.value || 0)}
                      </p>
                    </div>
                  </div>

                  {/* Forecast Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Période</th>
                          <th className="text-right py-2 px-3">Prévision</th>
                          <th className="text-right py-2 px-3">Min</th>
                          <th className="text-right py-2 px-3">Max</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forecast.forecast.map((point, i) => (
                          <tr key={i} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-3">{point.date}</td>
                            <td className="text-right py-2 px-3 font-medium">
                              {formatValue(point.value)}
                            </td>
                            <td className="text-right py-2 px-3 text-muted-foreground">
                              {formatValue(forecast.confidence.lower[i].value)}
                            </td>
                            <td className="text-right py-2 px-3 text-muted-foreground">
                              {formatValue(forecast.confidence.upper[i].value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Accuracy Metrics */}
                  <div className="flex gap-4 text-sm">
                    <span className="text-muted-foreground">
                      MAPE: <span className="font-medium">{forecast.accuracy.mape.toFixed(2)}%</span>
                    </span>
                    <span className="text-muted-foreground">
                      RMSE: <span className="font-medium">{forecast.accuracy.rmse.toFixed(2)}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Saisonnalité: <span className="font-medium">{forecast.seasonality ? 'Détectée' : 'Non détectée'}</span>
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Anomalies Détectées</CardTitle>
              <CardDescription>
                Points de données significativement différents de la normale
              </CardDescription>
            </CardHeader>
            <CardContent>
              {anomalies && anomalies.anomalies.length > 0 ? (
                <div className="space-y-3">
                  {anomalies.anomalies.map((anomaly, i) => (
                    <div
                      key={i}
                      className={cn(
                        'p-3 rounded-lg border',
                        anomaly.severity === 'high' && 'border-red-300 bg-red-50',
                        anomaly.severity === 'medium' && 'border-amber-300 bg-amber-50',
                        anomaly.severity === 'low' && 'border-gray-200 bg-gray-50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{anomaly.date}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'ml-2',
                              anomaly.severity === 'high' && 'border-red-500 text-red-700',
                              anomaly.severity === 'medium' && 'border-amber-500 text-amber-700'
                            )}
                          >
                            {anomaly.severity === 'high' ? 'Critique' :
                             anomaly.severity === 'medium' ? 'Modéré' : 'Faible'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatValue(anomaly.value)}</p>
                          <p className="text-xs text-muted-foreground">
                            Attendu: {formatValue(anomaly.expected)}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Déviation: {anomaly.deviation.toFixed(1)}%
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune anomalie détectée</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Tab */}
        <TabsContent value="report" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapport Analytique</CardTitle>
              <CardDescription>
                Analyse narrative générée par IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              {report ? (
                <div className="prose prose-sm max-w-none">
                  {report.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="mb-4 text-muted-foreground leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Rapport non disponible
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PredictivePanel;
