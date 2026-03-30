// ============================================
// InsightGov Africa - Metrics Collection System
// Comprehensive metrics for monitoring and analytics
// ============================================

import * as Sentry from '@sentry/nextjs';

// ============================================
// TYPES
// ============================================

export interface MetricValue {
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface MetricEntry {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  values: MetricValue[];
  unit?: string;
  description?: string;
}

export interface ApiMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: number;
  userId?: string;
  organizationId?: string;
  error?: string;
}

export interface DatabaseMetrics {
  operation: string;
  table: string;
  duration: number;
  timestamp: number;
  rowsAffected?: number;
  error?: string;
}

export interface SessionMetrics {
  sessionId: string;
  userId: string;
  organizationId?: string;
  startTime: number;
  endTime?: number;
  pageViews: number;
  actions: number;
  errors: number;
  device?: string;
  browser?: string;
  country?: string;
}

export interface ErrorMetrics {
  errorType: string;
  message: string;
  stack?: string;
  timestamp: number;
  userId?: string;
  organizationId?: string;
  endpoint?: string;
  count: number;
}

export interface PerformanceMetrics {
  cpuUsage: number;
  memoryUsage: number;
  heapUsed: number;
  heapTotal: number;
  eventLoopLag?: number;
  timestamp: number;
}

// ============================================
// METRICS STORE (In-Memory)
// ============================================

class MetricsStore {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private apiMetrics: ApiMetrics[] = [];
  private dbMetrics: DatabaseMetrics[] = [];
  private sessionMetrics: Map<string, SessionMetrics> = new Map();
  private errorMetrics: Map<string, ErrorMetrics> = new Map();
  private performanceHistory: PerformanceMetrics[] = [];

  // Max items to keep in memory
  private readonly MAX_API_METRICS = 10000;
  private readonly MAX_DB_METRICS = 10000;
  private readonly MAX_PERFORMANCE_HISTORY = 1000;
  private readonly MAX_HISTOGRAM_SIZE = 1000;

  // ============================================
  // COUNTERS
  // ============================================

  incrementCounter(name: string, value: number = 1, tags?: Record<string, string>): void {
    const key = this.getTaggedKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    // Send to Sentry as metric
    Sentry.metrics.increment(name, value, { tags });
  }

  getCounter(name: string, tags?: Record<string, string>): number {
    return this.counters.get(this.getTaggedKey(name, tags)) || 0;
  }

  // ============================================
  // GAUGES
  // ============================================

  setGauge(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getTaggedKey(name, tags);
    this.gauges.set(key, value);

    // Send to Sentry as metric
    Sentry.metrics.gauge(name, value, { tags });
  }

  getGauge(name: string, tags?: Record<string, string>): number {
    return this.gauges.get(this.getTaggedKey(name, tags)) || 0;
  }

  // ============================================
  // HISTOGRAMS
  // ============================================

  recordHistogram(name: string, value: number, tags?: Record<string, string>): void {
    const key = this.getTaggedKey(name, tags);
    const values = this.histograms.get(key) || [];
    values.push(value);

    // Keep only the last N values
    if (values.length > this.MAX_HISTOGRAM_SIZE) {
      values.shift();
    }

    this.histograms.set(key, values);

    // Send to Sentry as distribution
    Sentry.metrics.distribution(name, value, { tags });
  }

  getHistogramStats(name: string, tags?: Record<string, string>): {
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    count: number;
  } | null {
    const values = this.histograms.get(this.getTaggedKey(name, tags));
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;

    return {
      min: sorted[0],
      max: sorted[count - 1],
      avg: sorted.reduce((a, b) => a + b, 0) / count,
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
      count,
    };
  }

  // ============================================
  // API METRICS
  // ============================================

  recordApiMetric(metric: ApiMetrics): void {
    this.apiMetrics.push(metric);

    // Trim if too large
    if (this.apiMetrics.length > this.MAX_API_METRICS) {
      this.apiMetrics = this.apiMetrics.slice(-this.MAX_API_METRICS);
    }

    // Record response time histogram
    this.recordHistogram('api.response_time', metric.responseTime, {
      endpoint: metric.endpoint,
      method: metric.method,
      status: String(metric.statusCode),
    });

    // Increment request counter
    this.incrementCounter('api.requests', 1, {
      endpoint: metric.endpoint,
      method: metric.method,
      status: String(metric.statusCode),
    });

    // Track errors
    if (metric.statusCode >= 400) {
      this.incrementCounter('api.errors', 1, {
        endpoint: metric.endpoint,
        method: metric.method,
        status: String(metric.statusCode),
      });
    }
  }

  getApiMetrics(limit: number = 100): ApiMetrics[] {
    return this.apiMetrics.slice(-limit);
  }

  getApiMetricsStats(windowMs: number = 60000): {
    totalRequests: number;
    errorRate: number;
    avgResponseTime: number;
    p95ResponseTime: number;
    requestsByEndpoint: Record<string, number>;
    errorsByEndpoint: Record<string, number>;
  } {
    const cutoff = Date.now() - windowMs;
    const recent = this.apiMetrics.filter(m => m.timestamp >= cutoff);

    if (recent.length === 0) {
      return {
        totalRequests: 0,
        errorRate: 0,
        avgResponseTime: 0,
        p95ResponseTime: 0,
        requestsByEndpoint: {},
        errorsByEndpoint: {},
      };
    }

    const errors = recent.filter(m => m.statusCode >= 400);
    const responseTimes = recent.map(m => m.responseTime).sort((a, b) => a - b);
    const requestsByEndpoint: Record<string, number> = {};
    const errorsByEndpoint: Record<string, number> = {};

    for (const m of recent) {
      const key = `${m.method} ${m.endpoint}`;
      requestsByEndpoint[key] = (requestsByEndpoint[key] || 0) + 1;
      if (m.statusCode >= 400) {
        errorsByEndpoint[key] = (errorsByEndpoint[key] || 0) + 1;
      }
    }

    return {
      totalRequests: recent.length,
      errorRate: errors.length / recent.length,
      avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
      requestsByEndpoint,
      errorsByEndpoint,
    };
  }

  // ============================================
  // DATABASE METRICS
  // ============================================

  recordDbMetric(metric: DatabaseMetrics): void {
    this.dbMetrics.push(metric);

    // Trim if too large
    if (this.dbMetrics.length > this.MAX_DB_METRICS) {
      this.dbMetrics = this.dbMetrics.slice(-this.MAX_DB_METRICS);
    }

    // Record query time histogram
    this.recordHistogram('db.query_time', metric.duration, {
      operation: metric.operation,
      table: metric.table,
    });

    // Increment query counter
    this.incrementCounter('db.queries', 1, {
      operation: metric.operation,
      table: metric.table,
      error: metric.error ? 'true' : 'false',
    });
  }

  getDbMetrics(limit: number = 100): DatabaseMetrics[] {
    return this.dbMetrics.slice(-limit);
  }

  getDbMetricsStats(windowMs: number = 60000): {
    totalQueries: number;
    avgQueryTime: number;
    p95QueryTime: number;
    errorRate: number;
    queriesByTable: Record<string, number>;
    slowQueries: DatabaseMetrics[];
  } {
    const cutoff = Date.now() - windowMs;
    const recent = this.dbMetrics.filter(m => m.timestamp >= cutoff);

    if (recent.length === 0) {
      return {
        totalQueries: 0,
        avgQueryTime: 0,
        p95QueryTime: 0,
        errorRate: 0,
        queriesByTable: {},
        slowQueries: [],
      };
    }

    const errors = recent.filter(m => m.error);
    const queryTimes = recent.map(m => m.duration).sort((a, b) => a - b);
    const queriesByTable: Record<string, number> = {};

    for (const m of recent) {
      queriesByTable[m.table] = (queriesByTable[m.table] || 0) + 1;
    }

    // Slow queries (> 1 second)
    const slowQueries = recent.filter(m => m.duration > 1000);

    return {
      totalQueries: recent.length,
      avgQueryTime: queryTimes.reduce((a, b) => a + b, 0) / queryTimes.length,
      p95QueryTime: queryTimes[Math.floor(queryTimes.length * 0.95)] || 0,
      errorRate: errors.length / recent.length,
      queriesByTable,
      slowQueries,
    };
  }

  // ============================================
  // SESSION METRICS
  // ============================================

  startSession(sessionId: string, userId: string, metadata?: Partial<SessionMetrics>): void {
    this.sessionMetrics.set(sessionId, {
      sessionId,
      userId,
      startTime: Date.now(),
      pageViews: 0,
      actions: 0,
      errors: 0,
      ...metadata,
    });

    this.incrementCounter('sessions.started');
  }

  endSession(sessionId: string): SessionMetrics | undefined {
    const session = this.sessionMetrics.get(sessionId);
    if (session) {
      session.endTime = Date.now();
      this.incrementCounter('sessions.ended');
      this.recordHistogram('sessions.duration', session.endTime - session.startTime);
    }
    return session;
  }

  recordPageView(sessionId: string): void {
    const session = this.sessionMetrics.get(sessionId);
    if (session) {
      session.pageViews++;
    }
    this.incrementCounter('page_views');
  }

  recordUserAction(sessionId: string): void {
    const session = this.sessionMetrics.get(sessionId);
    if (session) {
      session.actions++;
    }
    this.incrementCounter('user_actions');
  }

  recordSessionError(sessionId: string): void {
    const session = this.sessionMetrics.get(sessionId);
    if (session) {
      session.errors++;
    }
  }

  getActiveSessions(): number {
    let active = 0;
    for (const session of this.sessionMetrics.values()) {
      if (!session.endTime) active++;
    }
    return active;
  }

  getSessionMetrics(): SessionMetrics[] {
    return Array.from(this.sessionMetrics.values());
  }

  // ============================================
  // ERROR METRICS
  // ============================================

  recordError(error: Error, context?: { userId?: string; organizationId?: string; endpoint?: string }): void {
    const key = `${error.name}:${error.message}`;

    const existing = this.errorMetrics.get(key);
    if (existing) {
      existing.count++;
      existing.timestamp = Date.now();
    } else {
      this.errorMetrics.set(key, {
        errorType: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        userId: context?.userId,
        organizationId: context?.organizationId,
        endpoint: context?.endpoint,
        count: 1,
      });
    }

    this.incrementCounter('errors.total', 1, { type: error.name });
  }

  getErrorMetrics(limit: number = 100): ErrorMetrics[] {
    return Array.from(this.errorMetrics.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getErrorRate(windowMs: number = 60000): number {
    const cutoff = Date.now() - windowMs;
    const recentErrors = Array.from(this.errorMetrics.values())
      .filter(e => e.timestamp >= cutoff);

    const totalErrors = recentErrors.reduce((sum, e) => sum + e.count, 0);
    const recentApiCalls = this.apiMetrics.filter(m => m.timestamp >= cutoff).length;

    return recentApiCalls > 0 ? totalErrors / recentApiCalls : 0;
  }

  // ============================================
  // PERFORMANCE METRICS
  // ============================================

  recordPerformance(): void {
    const mem = process.memoryUsage();
    const perf: PerformanceMetrics = {
      cpuUsage: process.cpuUsage?.().user ? process.cpuUsage().user / 1000000 : 0,
      memoryUsage: (mem.heapUsed / mem.heapTotal) * 100,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      timestamp: Date.now(),
    };

    this.performanceHistory.push(perf);

    if (this.performanceHistory.length > this.MAX_PERFORMANCE_HISTORY) {
      this.performanceHistory = this.performanceHistory.slice(-this.MAX_PERFORMANCE_HISTORY);
    }

    // Update gauges
    this.setGauge('performance.memory_usage', perf.memoryUsage);
    this.setGauge('performance.heap_used', perf.heapUsed);
    this.setGauge('performance.heap_total', perf.heapTotal);
  }

  getPerformanceHistory(limit: number = 100): PerformanceMetrics[] {
    return this.performanceHistory.slice(-limit);
  }

  // ============================================
  // UTILITIES
  // ============================================

  private getTaggedKey(name: string, tags?: Record<string, string>): string {
    if (!tags) return name;
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}|${tagStr}`;
  }

  // Get all metrics as a summary
  getSummary(): {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    histograms: Record<string, ReturnType<MetricsStore['getHistogramStats']>>;
    api: ReturnType<MetricsStore['getApiMetricsStats']>;
    database: ReturnType<MetricsStore['getDbMetricsStats']>;
    sessions: {
      active: number;
      total: number;
    };
    errors: {
      rate: number;
      recent: ErrorMetrics[];
    };
  } {
    const countersObj: Record<string, number> = {};
    const gaugesObj: Record<string, number> = {};
    const histogramsObj: Record<string, ReturnType<MetricsStore['getHistogramStats']>> = {};

    for (const [key, value] of this.counters) {
      countersObj[key] = value;
    }

    for (const [key, value] of this.gauges) {
      gaugesObj[key] = value;
    }

    for (const [key] of this.histograms) {
      const stats = this.getHistogramStats(key.split('|')[0]);
      if (stats) {
        histogramsObj[key] = stats;
      }
    }

    return {
      counters: countersObj,
      gauges: gaugesObj,
      histograms: histogramsObj,
      api: this.getApiMetricsStats(),
      database: this.getDbMetricsStats(),
      sessions: {
        active: this.getActiveSessions(),
        total: this.sessionMetrics.size,
      },
      errors: {
        rate: this.getErrorRate(),
        recent: this.getErrorMetrics(10),
      },
    };
  }

  // Clear all metrics
  clear(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.apiMetrics = [];
    this.dbMetrics = [];
    this.sessionMetrics.clear();
    this.errorMetrics.clear();
    this.performanceHistory = [];
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const metrics = new MetricsStore();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Track API request with automatic timing
 */
export function trackApiRequest(
  endpoint: string,
  method: string,
  handler: () => Promise<Response>,
  context?: { userId?: string; organizationId?: string }
): Promise<Response> {
  const startTime = Date.now();

  return handler()
    .then((response) => {
      metrics.recordApiMetric({
        endpoint,
        method,
        statusCode: response.status,
        responseTime: Date.now() - startTime,
        timestamp: startTime,
        ...context,
      });
      return response;
    })
    .catch((error) => {
      metrics.recordApiMetric({
        endpoint,
        method,
        statusCode: 500,
        responseTime: Date.now() - startTime,
        timestamp: startTime,
        error: error.message,
        ...context,
      });
      throw error;
    });
}

/**
 * Track database query with automatic timing
 */
export async function trackDbQuery<T>(
  operation: string,
  table: string,
  query: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();

  try {
    const result = await query();
    metrics.recordDbMetric({
      operation,
      table,
      duration: Date.now() - startTime,
      timestamp: startTime,
    });
    return result;
  } catch (error) {
    metrics.recordDbMetric({
      operation,
      table,
      duration: Date.now() - startTime,
      timestamp: startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Start periodic performance recording
 */
export function startPerformanceMonitoring(intervalMs: number = 30000): NodeJS.Timeout {
  // Record initial performance
  metrics.recordPerformance();

  // Set up periodic recording
  return setInterval(() => {
    metrics.recordPerformance();
  }, intervalMs);
}

/**
 * Middleware to track API metrics
 */
export function withMetricsTracking(
  endpoint: string,
  method: string,
  handler: () => Promise<Response>
): Promise<Response> {
  return trackApiRequest(endpoint, method, handler);
}

// ============================================
// EXPORTS
// ============================================

export default metrics;
