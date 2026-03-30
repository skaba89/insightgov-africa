/**
 * InsightGov Africa - Scheduled Reports Service
 * ==============================================
 * Service de planification et d'envoi automatique de rapports.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ScheduledReport {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: 'dashboard' | 'kpi_summary' | 'anomaly_alert' | 'trend_report';
  
  schedule: {
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    timezone: string;
  };
  
  recipients: {
    type: 'email' | 'slack' | 'webhook' | 'teams';
    address: string;
    name?: string;
  }[];
  
  content: {
    dashboardConfigId?: string;
    kpiIds?: string[];
    includeExecutiveSummary: boolean;
    includeTrends: boolean;
    includeAnomalies: boolean;
    format: 'pdf' | 'excel' | 'html' | 'json';
  };
  
  isActive: boolean;
  lastRunAt?: string;
  nextRunAt: string;
  createdAt: string;
}

export interface AlertRule {
  id: string;
  organizationId: string;
  name: string;
  metric: {
    type: 'kpi' | 'column';
    kpiId?: string;
    column?: string;
  };
  condition: {
    operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'change_percent_gt';
    value: number;
  };
  actions: {
    type: 'email' | 'slack' | 'webhook';
    recipients: string[];
  }[];
  isActive: boolean;
  lastTriggeredAt?: string;
}

// =============================================================================
// SCHEDULE FUNCTIONS
// =============================================================================

export function calculateNextRun(schedule: ScheduledReport['schedule']): Date {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);
  
  let next = new Date();
  next.setHours(hours, minutes, 0, 0);
  
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  switch (schedule.frequency) {
    case 'weekly':
      if (schedule.dayOfWeek !== undefined) {
        const currentDay = next.getDay();
        const daysUntil = (schedule.dayOfWeek - currentDay + 7) % 7;
        if (daysUntil === 0 && next <= now) {
          next.setDate(next.getDate() + 7);
        } else {
          next.setDate(next.getDate() + daysUntil);
        }
      }
      break;
      
    case 'monthly':
      if (schedule.dayOfMonth !== undefined) {
        next.setDate(schedule.dayOfMonth);
        if (next <= now) {
          next.setMonth(next.getMonth() + 1);
        }
      }
      break;
  }
  
  return next;
}

export function evaluateAlertRule(
  rule: AlertRule,
  currentValue: number,
  previousValue?: number
): { triggered: boolean; reason?: string } {
  const { condition } = rule;
  let triggered = false;
  let reason = '';
  
  switch (condition.operator) {
    case 'gt':
      triggered = currentValue > condition.value;
      reason = `${currentValue} > ${condition.value}`;
      break;
    case 'lt':
      triggered = currentValue < condition.value;
      reason = `${currentValue} < ${condition.value}`;
      break;
    case 'change_percent_gt':
      if (previousValue && previousValue !== 0) {
        const change = ((currentValue - previousValue) / previousValue) * 100;
        triggered = change > condition.value;
        reason = `Changement de ${change.toFixed(1)}%`;
      }
      break;
  }
  
  return { triggered, reason: triggered ? reason : undefined };
}

export async function sendReportNotification(
  report: ScheduledReport,
  content: Buffer | string,
  metadata: Record<string, unknown>
): Promise<boolean> {
  for (const recipient of report.recipients) {
    console.log(`[REPORT] Sending "${report.name}" via ${recipient.type} to ${recipient.address}`);
    
    if (recipient.type === 'slack' || recipient.type === 'webhook') {
      try {
        await fetch(recipient.address, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            report: report.name,
            metadata,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error('Erreur envoi webhook:', error);
      }
    }
  }
  
  return true;
}

export async function sendAlertNotification(
  rule: AlertRule,
  currentValue: number,
  reason: string
): Promise<void> {
  for (const action of rule.actions) {
    const message = `🚨 ALERTE: ${rule.name}\nValeur: ${currentValue}\nCondition: ${reason}`;
    
    if (action.type === 'slack' || action.type === 'webhook') {
      await fetch(action.recipients[0], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: message,
          alert: rule.name,
          value: currentValue,
          reason,
        }),
      });
    }
  }
}

export default {
  calculateNextRun,
  evaluateAlertRule,
  sendReportNotification,
  sendAlertNotification,
};
