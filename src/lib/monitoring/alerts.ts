// ============================================
// InsightGov Africa - Alerting Configuration
// Comprehensive alert system for monitoring
// ============================================

import * as Sentry from '@sentry/nextjs';
import { metrics } from './metrics';

// ============================================
// TYPES
// ============================================

export type AlertSeverity = 'info' | 'warning' | 'error' | 'critical';
export type AlertStatus = 'active' | 'resolved' | 'silenced' | 'acknowledged';

export interface Alert {
  id: string;
  name: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  silenceUntil?: number;
  metadata?: Record<string, unknown>;
  occurrences: number;
  lastValue?: number;
  threshold: AlertThreshold;
}

export interface AlertThreshold {
  metric: string;
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  value: number;
  duration?: number; // Duration in ms before alerting
  aggregation?: 'avg' | 'max' | 'min' | 'sum' | 'count';
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: AlertSeverity;
  thresholds: AlertThreshold[];
  cooldown: number; // Minimum time between alerts in ms
  channels: AlertChannel[];
  metadata?: Record<string, unknown>;
}

export type AlertChannel =
  | { type: 'sentry'; tags?: Record<string, string> }
  | { type: 'webhook'; url: string; headers?: Record<string, string> }
  | { type: 'email'; recipients: string[] }
  | { type: 'slack'; webhookUrl: string; channel?: string }
  | { type: 'log' };

export interface AlertHistory {
  alertId: string;
  timestamp: number;
  action: 'triggered' | 'resolved' | 'acknowledged' | 'silenced';
  value?: number;
  message: string;
  userId?: string;
}

// ============================================
// DEFAULT ALERT THRESHOLDS
// ============================================

export const DEFAULT_ALERT_THRESHOLDS = {
  // Error rate thresholds
  ERROR_RATE_WARNING: 0.05, // 5%
  ERROR_RATE_CRITICAL: 0.15, // 15%

  // Response time thresholds (ms)
  RESPONSE_TIME_WARNING: 1000, // 1 second
  RESPONSE_TIME_CRITICAL: 5000, // 5 seconds

  // Memory usage thresholds (%)
  MEMORY_WARNING: 80,
  MEMORY_CRITICAL: 95,

  // CPU usage thresholds (%)
  CPU_WARNING: 70,
  CPU_CRITICAL: 90,

  // Database query time thresholds (ms)
  DB_QUERY_WARNING: 500,
  DB_QUERY_CRITICAL: 2000,

  // Disk usage thresholds (%)
  DISK_WARNING: 80,
  DISK_CRITICAL: 95,

  // Session thresholds
  SESSION_ERROR_WARNING: 10, // errors per session
  SESSION_ERROR_CRITICAL: 25,

  // API specific thresholds
  API_ERROR_SPIKE: 10, // errors per minute
  API_ERROR_SPIKE_CRITICAL: 50,

  // Cooldown periods (ms)
  COOLDOWN_DEFAULT: 300000, // 5 minutes
  COOLDOWN_CRITICAL: 60000, // 1 minute
} as const;

// ============================================
// ALERT RULES CONFIGURATION
// ============================================

export const ALERT_RULES: AlertRule[] = [
  // Error Rate Alerts
  {
    id: 'error-rate-high',
    name: 'High Error Rate',
    description: 'API error rate exceeds threshold',
    enabled: true,
    severity: 'warning',
    thresholds: [{
      metric: 'api.error_rate',
      operator: 'gt',
      value: DEFAULT_ALERT_THRESHOLDS.ERROR_RATE_WARNING,
      duration: 60000, // 1 minute
    }],
    cooldown: DEFAULT_ALERT_THRESHOLDS.COOLDOWN_DEFAULT,
    channels: [{ type: 'sentry' }, { type: 'log' }],
  },
  {
    id: 'error-rate-critical',
    name: 'Critical Error Rate',
    description: 'API error rate critically high',
    enabled: true,
    severity: 'critical',
    thresholds: [{
      metric: 'api.error_rate',
      operator: 'gt',
      value: DEFAULT_ALERT_THRESHOLDS.ERROR_RATE_CRITICAL,
      duration: 30000, // 30 seconds
    }],
    cooldown: DEFAULT_ALERT_THRESHOLDS.COOLDOWN_CRITICAL,
    channels: [{ type: 'sentry' }, { type: 'log' }],
  },

  // Response Time Alerts
  {
    id: 'response-time-slow',
    name: 'Slow API Response',
    description: 'API response time exceeds threshold',
    enabled: true,
    severity: 'warning',
    thresholds: [{
      metric: 'api.response_time_p95',
      operator: 'gt',
      value: DEFAULT_ALERT_THRESHOLDS.RESPONSE_TIME_WARNING,
      duration: 120000, // 2 minutes
    }],
    cooldown: DEFAULT_ALERT_THRESHOLDS.COOLDOWN_DEFAULT,
    channels: [{ type: 'sentry' }, { type: 'log' }],
  },
  {
    id: 'response-time-critical',
    name: 'Critical Response Time',
    description: 'API response time critically slow',
    enabled: true,
    severity: 'critical',
    thresholds: [{
      metric: 'api.response_time_p95',
      operator: 'gt',
      value: DEFAULT_ALERT_THRESHOLDS.RESPONSE_TIME_CRITICAL,
      duration: 60000, // 1 minute
    }],
    cooldown: DEFAULT_ALERT_THRESHOLDS.COOLDOWN_CRITICAL,
    channels: [{ type: 'sentry' }, { type: 'log' }],
  },

  // Memory Alerts
  {
    id: 'memory-high',
    name: 'High Memory Usage',
    description: 'Memory usage exceeds threshold',
    enabled: true,
    severity: 'warning',
    thresholds: [{
      metric: 'system.memory_usage',
      operator: 'gt',
      value: DEFAULT_ALERT_THRESHOLDS.MEMORY_WARNING,
    }],
    cooldown: DEFAULT_ALERT_THRESHOLDS.COOLDOWN_DEFAULT,
    channels: [{ type: 'sentry' }, { type: 'log' }],
  },
  {
    id: 'memory-critical',
    name: 'Critical Memory Usage',
    description: 'Memory usage critically high, risk of OOM',
    enabled: true,
    severity: 'critical',
    thresholds: [{
      metric: 'system.memory_usage',
      operator: 'gt',
      value: DEFAULT_ALERT_THRESHOLDS.MEMORY_CRITICAL,
    }],
    cooldown: DEFAULT_ALERT_THRESHOLDS.COOLDOWN_CRITICAL,
    channels: [{ type: 'sentry' }, { type: 'log' }],
  },

  // Database Alerts
  {
    id: 'db-slow-queries',
    name: 'Slow Database Queries',
    description: 'Database query time exceeds threshold',
    enabled: true,
    severity: 'warning',
    thresholds: [{
      metric: 'db.query_time_p95',
      operator: 'gt',
      value: DEFAULT_ALERT_THRESHOLDS.DB_QUERY_WARNING,
      duration: 60000,
    }],
    cooldown: DEFAULT_ALERT_THRESHOLDS.COOLDOWN_DEFAULT,
    channels: [{ type: 'sentry' }, { type: 'log' }],
  },
  {
    id: 'db-critical-queries',
    name: 'Critical Database Performance',
    description: 'Database queries are critically slow',
    enabled: true,
    severity: 'critical',
    thresholds: [{
      metric: 'db.query_time_p95',
      operator: 'gt',
      value: DEFAULT_ALERT_THRESHOLDS.DB_QUERY_CRITICAL,
      duration: 30000,
    }],
    cooldown: DEFAULT_ALERT_THRESHOLDS.COOLDOWN_CRITICAL,
    channels: [{ type: 'sentry' }, { type: 'log' }],
  },

  // Error Spike Detection
  {
    id: 'error-spike',
    name: 'Error Spike Detected',
    description: 'Sudden increase in error rate',
    enabled: true,
    severity: 'error',
    thresholds: [{
      metric: 'api.errors_per_minute',
      operator: 'gt',
      value: DEFAULT_ALERT_THRESHOLDS.API_ERROR_SPIKE,
    }],
    cooldown: 60000, // 1 minute
    channels: [{ type: 'sentry' }, { type: 'log' }],
  },
  {
    id: 'error-spike-critical',
    name: 'Critical Error Spike',
    description: 'Massive spike in error rate',
    enabled: true,
    severity: 'critical',
    thresholds: [{
      metric: 'api.errors_per_minute',
      operator: 'gt',
      value: DEFAULT_ALERT_THRESHOLDS.API_ERROR_SPIKE_CRITICAL,
    }],
    cooldown: 30000, // 30 seconds
    channels: [{ type: 'sentry' }, { type: 'log' }],
  },

  // Performance Degradation
  {
    id: 'performance-degradation',
    name: 'Performance Degradation',
    description: 'Overall system performance degraded',
    enabled: true,
    severity: 'warning',
    thresholds: [{
      metric: 'system.cpu_usage',
      operator: 'gt',
      value: DEFAULT_ALERT_THRESHOLDS.CPU_WARNING,
      duration: 120000,
    }],
    cooldown: DEFAULT_ALERT_THRESHOLDS.COOLDOWN_DEFAULT,
    channels: [{ type: 'sentry' }, { type: 'log' }],
  },
];

// ============================================
// ALERT MANAGER
// ============================================

class AlertManager {
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: AlertHistory[] = [];
  private lastTriggered: Map<string, number> = new Map();
  private silenceRules: Map<string, number> = new Map();

  private readonly MAX_HISTORY = 1000;

  /**
   * Check all alert rules against current metrics
   */
  checkAlerts(): Alert[] {
    const triggeredAlerts: Alert[] = [];
    const now = Date.now();

    for (const rule of ALERT_RULES) {
      if (!rule.enabled) continue;

      // Check if silenced
      const silenceUntil = this.silenceRules.get(rule.id);
      if (silenceUntil && now < silenceUntil) continue;

      // Check cooldown
      const lastTriggered = this.lastTriggered.get(rule.id) || 0;
      if (now - lastTriggered < rule.cooldown) continue;

      // Evaluate thresholds
      const metricValue = this.getMetricValue(rule.thresholds[0]);
      const threshold = rule.thresholds[0];

      if (this.evaluateThreshold(metricValue, threshold)) {
        const alert = this.triggerAlert(rule, metricValue);
        triggeredAlerts.push(alert);
        this.lastTriggered.set(rule.id, now);
      }
    }

    return triggeredAlerts;
  }

  /**
   * Get current metric value
   */
  private getMetricValue(threshold: AlertThreshold): number {
    const stats = metrics.getSummary();

    switch (threshold.metric) {
      case 'api.error_rate':
        return stats.api.errorRate * 100; // Convert to percentage
      case 'api.response_time_p95':
        return stats.api.p95ResponseTime;
      case 'api.response_time_avg':
        return stats.api.avgResponseTime;
      case 'api.errors_per_minute':
        const apiMetrics = metrics.getApiMetrics(60);
        const oneMinuteAgo = Date.now() - 60000;
        return apiMetrics.filter(m => m.timestamp >= oneMinuteAgo && m.statusCode >= 400).length;
      case 'db.query_time_p95':
        return stats.database.p95QueryTime;
      case 'db.query_time_avg':
        return stats.database.avgQueryTime;
      case 'db.error_rate':
        return stats.database.errorRate * 100;
      case 'system.memory_usage':
        return stats.gauges['performance.memory_usage'] || 0;
      case 'system.cpu_usage':
        const cpu = process.cpuUsage?.();
        return cpu ? (cpu.user / 1000000) : 0;
      case 'sessions.active':
        return stats.sessions.active;
      case 'sessions.total':
        return stats.sessions.total;
      case 'errors.rate':
        return stats.errors.rate * 100;
      default:
        // Try to get from counters or gauges
        return stats.counters[threshold.metric] || stats.gauges[threshold.metric] || 0;
    }
  }

  /**
   * Evaluate if threshold is breached
   */
  private evaluateThreshold(value: number, threshold: AlertThreshold): boolean {
    switch (threshold.operator) {
      case 'gt': return value > threshold.value;
      case 'gte': return value >= threshold.value;
      case 'lt': return value < threshold.value;
      case 'lte': return value <= threshold.value;
      case 'eq': return value === threshold.value;
      case 'neq': return value !== threshold.value;
      default: return false;
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(rule: AlertRule, value: number): Alert {
    const now = Date.now();
    const existingAlert = this.activeAlerts.get(rule.id);

    if (existingAlert) {
      // Update existing alert
      existingAlert.occurrences++;
      existingAlert.lastValue = value;
      existingAlert.updatedAt = now;
      return existingAlert;
    }

    // Create new alert
    const alert: Alert = {
      id: `alert-${rule.id}-${now}`,
      name: rule.name,
      description: rule.description,
      severity: rule.severity,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      occurrences: 1,
      lastValue: value,
      threshold: rule.thresholds[0],
      metadata: rule.metadata,
    };

    this.activeAlerts.set(rule.id, alert);
    this.recordHistory(alert.id, 'triggered', value, `Alert triggered: ${rule.name}`);

    // Send to channels
    this.sendToChannels(rule, alert);

    return alert;
  }

  /**
   * Send alert to configured channels
   */
  private async sendToChannels(rule: AlertRule, alert: Alert): Promise<void> {
    for (const channel of rule.channels) {
      try {
        switch (channel.type) {
          case 'sentry':
            Sentry.captureMessage(
              `[${alert.severity.toUpperCase()}] ${alert.name}: ${alert.description}`,
              {
                level: alert.severity === 'critical' ? 'fatal' : alert.severity === 'error' ? 'error' : 'warning',
                tags: {
                  alert_id: alert.id,
                  alert_name: alert.name,
                  severity: alert.severity,
                  ...channel.tags,
                },
                extra: {
                  value: alert.lastValue,
                  threshold: alert.threshold,
                  occurrences: alert.occurrences,
                },
              }
            );
            break;

          case 'webhook':
            await fetch(channel.url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...channel.headers,
              },
              body: JSON.stringify({
                alert,
                rule,
                timestamp: new Date().toISOString(),
              }),
            });
            break;

          case 'slack':
            await fetch(channel.webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                channel: channel.channel,
                attachments: [{
                  color: alert.severity === 'critical' ? 'danger' : alert.severity === 'error' ? 'warning' : '#FFA500',
                  title: `Alert: ${alert.name}`,
                  text: alert.description,
                  fields: [
                    { title: 'Severity', value: alert.severity, short: true },
                    { title: 'Current Value', value: String(alert.lastValue), short: true },
                    { title: 'Threshold', value: `${alert.threshold.operator} ${alert.threshold.value}`, short: true },
                    { title: 'Occurrences', value: String(alert.occurrences), short: true },
                  ],
                  ts: Math.floor(alert.createdAt / 1000),
                }],
              }),
            });
            break;

          case 'email':
            // Email sending would be implemented here
            console.log(`[Alert] Would send email to: ${channel.recipients.join(', ')}`);
            break;

          case 'log':
            console.log(`[Alert ${alert.severity.toUpperCase()}] ${alert.name}: ${alert.description}`, {
              value: alert.lastValue,
              threshold: alert.threshold,
              occurrences: alert.occurrences,
            });
            break;
        }
      } catch (error) {
        console.error(`[Alert] Failed to send to ${channel.type}:`, error);
      }
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(ruleId: string): Alert | undefined {
    const alert = this.activeAlerts.get(ruleId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = Date.now();
      alert.updatedAt = alert.resolvedAt;
      this.activeAlerts.delete(ruleId);
      this.recordHistory(alert.id, 'resolved', undefined, 'Alert resolved');
    }
    return alert;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(ruleId: string, userId?: string): Alert | undefined {
    const alert = this.activeAlerts.get(ruleId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = Date.now();
      alert.acknowledgedBy = userId;
      alert.updatedAt = alert.acknowledgedAt;
      this.recordHistory(alert.id, 'acknowledged', undefined, 'Alert acknowledged', userId);
    }
    return alert;
  }

  /**
   * Silence an alert for a duration
   */
  silenceAlert(ruleId: string, durationMs: number): void {
    this.silenceRules.set(ruleId, Date.now() + durationMs);
    const alert = this.activeAlerts.get(ruleId);
    if (alert) {
      alert.status = 'silenced';
      alert.silenceUntil = Date.now() + durationMs;
      this.recordHistory(alert.id, 'silenced', undefined, `Alert silenced for ${durationMs}ms`);
    }
  }

  /**
   * Record alert history
   */
  private recordHistory(
    alertId: string,
    action: AlertHistory['action'],
    value: number | undefined,
    message: string,
    userId?: string
  ): void {
    this.alertHistory.push({
      alertId,
      timestamp: Date.now(),
      action,
      value,
      message,
      userId,
    });

    // Trim history
    if (this.alertHistory.length > this.MAX_HISTORY) {
      this.alertHistory = this.alertHistory.slice(-this.MAX_HISTORY);
    }
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get alert history
   */
  getHistory(limit: number = 100): AlertHistory[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Get alert by ID
   */
  getAlert(ruleId: string): Alert | undefined {
    return this.activeAlerts.get(ruleId);
  }

  /**
   * Clear all alerts
   */
  clearAll(): void {
    this.activeAlerts.clear();
  }

  /**
   * Run continuous alert checking
   */
  startMonitoring(intervalMs: number = 30000): NodeJS.Timeout {
    return setInterval(() => {
      this.checkAlerts();
    }, intervalMs);
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const alertManager = new AlertManager();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check for error spikes
 */
export function detectErrorSpike(windowMs: number = 60000): {
  detected: boolean;
  rate: number;
  threshold: number;
} {
  const stats = metrics.getApiMetricsStats(windowMs);
  const errorRate = stats.errorRate;

  return {
    detected: errorRate > DEFAULT_ALERT_THRESHOLDS.ERROR_RATE_WARNING,
    rate: errorRate,
    threshold: DEFAULT_ALERT_THRESHOLDS.ERROR_RATE_WARNING,
  };
}

/**
 * Check for performance degradation
 */
export function detectPerformanceDegradation(windowMs: number = 60000): {
  detected: boolean;
  responseTime: number;
  threshold: number;
} {
  const stats = metrics.getApiMetricsStats(windowMs);
  const responseTime = stats.p95ResponseTime;

  return {
    detected: responseTime > DEFAULT_ALERT_THRESHOLDS.RESPONSE_TIME_WARNING,
    responseTime,
    threshold: DEFAULT_ALERT_THRESHOLDS.RESPONSE_TIME_WARNING,
  };
}

/**
 * Check for memory pressure
 */
export function detectMemoryPressure(): {
  detected: boolean;
  usage: number;
  threshold: number;
} {
  const mem = process.memoryUsage();
  const usage = (mem.heapUsed / mem.heapTotal) * 100;

  return {
    detected: usage > DEFAULT_ALERT_THRESHOLDS.MEMORY_WARNING,
    usage,
    threshold: DEFAULT_ALERT_THRESHOLDS.MEMORY_WARNING,
  };
}

/**
 * Create custom alert
 */
export function createCustomAlert(
  name: string,
  description: string,
  severity: AlertSeverity,
  value: number,
  threshold: AlertThreshold,
  metadata?: Record<string, unknown>
): Alert {
  const now = Date.now();
  const alert: Alert = {
    id: `custom-${now}`,
    name,
    description,
    severity,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    occurrences: 1,
    lastValue: value,
    threshold,
    metadata,
  };

  // Send to Sentry
  Sentry.captureMessage(`[${severity.toUpperCase()}] ${name}: ${description}`, {
    level: severity === 'critical' ? 'fatal' : severity,
    tags: {
      alert_type: 'custom',
      alert_name: name,
    },
    extra: {
      value,
      threshold,
      metadata,
    },
  });

  return alert;
}

/**
 * Run all alert checks and return results
 */
export function runAlertChecks(): {
  errorSpike: ReturnType<typeof detectErrorSpike>;
  performanceDegradation: ReturnType<typeof detectPerformanceDegradation>;
  memoryPressure: ReturnType<typeof detectMemoryPressure>;
  activeAlerts: Alert[];
} {
  return {
    errorSpike: detectErrorSpike(),
    performanceDegradation: detectPerformanceDegradation(),
    memoryPressure: detectMemoryPressure(),
    activeAlerts: alertManager.getActiveAlerts(),
  };
}

// ============================================
// EXPORTS
// ============================================

export default alertManager;
