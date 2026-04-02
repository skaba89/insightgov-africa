import { prisma } from './db'
import { AuditAction, AuditSeverity, logAudit } from './audit-logger'

/**
 * Security Monitoring System
 * Real-time threat detection and automated response
 */

export interface SecurityAlert {
  id: string
  type: SecurityAlertType
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  metadata: Record<string, unknown>
  timestamp: Date
  resolved: boolean
}

export enum SecurityAlertType {
  BRUTE_FORCE_ATTEMPT = 'BRUTE_FORCE_ATTEMPT',
  SUSPICIOUS_LOGIN_LOCATION = 'SUSPICIOUS_LOGIN_LOCATION',
  MULTIPLE_FAILED_LOGINS = 'MULTIPLE_FAILED_LOGINS',
  API_KEY_ABUSE = 'API_KEY_ABUSE',
  RATE_LIMIT_ABUSE = 'RATE_LIMIT_ABUSE',
  DATA_EXFILTRATION_ATTEMPT = 'DATA_EXFILTRATION_ATTEMPT',
  PRIVILEGE_ESCALATION = 'PRIVILEGE_ESCALATION',
  UNUSUAL_DATA_ACCESS = 'UNUSUAL_DATA_ACCESS',
  ACCOUNT_TAKEOVER_SUSPECTED = 'ACCOUNT_TAKEOVER_SUSPECTED',
  SQL_INJECTION_ATTEMPT = 'SQL_INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
}

interface SecurityThresholds {
  failedLoginsWindow: number // ms
  maxFailedLogins: number
  apiCallsWindow: number // ms
  maxApiCalls: number
  dataExportWindow: number // ms
  maxDataExports: number
}

const DEFAULT_THRESHOLDS: SecurityThresholds = {
  failedLoginsWindow: 15 * 60 * 1000, // 15 minutes
  maxFailedLogins: 5,
  apiCallsWindow: 60 * 1000, // 1 minute
  maxApiCalls: 100,
  dataExportWindow: 60 * 60 * 1000, // 1 hour
  maxDataExports: 10,
}

// In-memory store for tracking (use Redis in production)
const securityEvents = new Map<string, { count: number; firstEvent: number }>()

/**
 * Track a security event
 */
function trackEvent(key: string, windowMs: number): { count: number; isNewWindow: boolean } {
  const now = Date.now()
  const record = securityEvents.get(key)
  
  if (!record || now - record.firstEvent > windowMs) {
    securityEvents.set(key, { count: 1, firstEvent: now })
    return { count: 1, isNewWindow: true }
  }
  
  record.count++
  return { count: record.count, isNewWindow: false }
}

/**
 * Clear old events periodically
 */
setInterval(() => {
  const now = Date.now()
  const maxAge = Math.max(
    DEFAULT_THRESHOLDS.failedLoginsWindow,
    DEFAULT_THRESHOLDS.apiCallsWindow,
    DEFAULT_THRESHOLDS.dataExportWindow
  )
  
  for (const [key, record] of securityEvents.entries()) {
    if (now - record.firstEvent > maxAge) {
      securityEvents.delete(key)
    }
  }
}, 60000)

/**
 * Check for brute force attack
 */
export async function detectBruteForce(
  identifier: string,
  ipAddress?: string
): Promise<{ isBlocked: boolean; remainingAttempts: number; blockDuration: number }> {
  const key = `failed_login:${identifier}:${ipAddress || 'unknown'}`
  const { count } = trackEvent(key, DEFAULT_THRESHOLDS.failedLoginsWindow)
  
  const remainingAttempts = Math.max(0, DEFAULT_THRESHOLDS.maxFailedLogins - count)
  const isBlocked = count >= DEFAULT_THRESHOLDS.maxFailedLogins
  const blockDuration = DEFAULT_THRESHOLDS.failedLoginsWindow
  
  if (isBlocked && count === DEFAULT_THRESHOLDS.maxFailedLogins) {
    // Log security alert on first block
    await logAudit({
      action: AuditAction.SECURITY_VIOLATION,
      severity: AuditSeverity.HIGH,
      description: `Brute force attack detected for identifier: ${identifier}`,
      metadata: {
        alertType: SecurityAlertType.BRUTE_FORCE_ATTEMPT,
        identifier,
        ipAddress,
        attemptCount: count,
      }
    })
  }
  
  return { isBlocked, remainingAttempts, blockDuration }
}

/**
 * Check for API abuse
 */
export async function detectApiAbuse(
  userId: string,
  endpoint: string
): Promise<{ isAbuse: boolean; callCount: number }> {
  const key = `api_calls:${userId}:${endpoint}`
  const { count } = trackEvent(key, DEFAULT_THRESHOLDS.apiCallsWindow)
  
  const isAbuse = count > DEFAULT_THRESHOLDS.maxApiCalls
  
  if (isAbuse && count === DEFAULT_THRESHOLDS.maxApiCalls + 1) {
    await logAudit({
      action: AuditAction.RATE_LIMIT_EXCEEDED,
      severity: AuditSeverity.MEDIUM,
      description: `API abuse detected for user ${userId} on endpoint ${endpoint}`,
      metadata: {
        alertType: SecurityAlertType.RATE_LIMIT_ABUSE,
        userId,
        endpoint,
        callCount: count,
      }
    })
  }
  
  return { isAbuse, callCount: count }
}

/**
 * Check for data exfiltration attempt
 */
export async function detectDataExfiltration(
  userId: string,
  organizationId: string
): Promise<{ isSuspected: boolean; exportCount: number }> {
  const key = `data_export:${userId}:${organizationId}`
  const { count } = trackEvent(key, DEFAULT_THRESHOLDS.dataExportWindow)
  
  const isSuspected = count > DEFAULT_THRESHOLDS.maxDataExports
  
  if (isSuspected && count === DEFAULT_THRESHOLDS.maxDataExports + 1) {
    await logAudit({
      action: AuditAction.SECURITY_VIOLATION,
      severity: AuditSeverity.HIGH,
      description: `Potential data exfiltration detected for user ${userId}`,
      userId,
      organizationId,
      metadata: {
        alertType: SecurityAlertType.DATA_EXFILTRATION_ATTEMPT,
        exportCount: count,
      }
    })
  }
  
  return { isSuspected, exportCount: count }
}

/**
 * Detect SQL injection patterns
 */
export function detectSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/i,
    /(--)|(\/\*)|(\*\/)/,
    /(\bOR\b|\bAND\b)\s*['"]?\d+['"]?\s*=\s*['"]?\d+/i,
    /UNION\s+(ALL\s+)?SELECT/i,
    /'\s*(OR|AND)\s*'/i,
    /\bEXEC\b|\bEXECUTE\b/i,
    /\bDECLARE\b/i,
    /\bCAST\b\s*\(/i,
    /\bCONVERT\b\s*\(/i,
    /xp_cmdshell/i,
    /WAITFOR\s+DELAY/i,
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Detect XSS patterns
 */
export function detectXss(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<img[^>]+onerror/gi,
    /<svg[^>]+onload/gi,
    /eval\s*\(/gi,
    /document\./gi,
    /window\./gi,
    /alert\s*\(/gi,
    /prompt\s*\(/gi,
    /confirm\s*\(/gi,
  ]
  
  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Validate input for security threats
 */
export async function validateInputSecurity(
  input: string,
  context: { userId?: string; organizationId?: string; endpoint?: string }
): Promise<{ isSecure: boolean; threats: string[] }> {
  const threats: string[] = []
  
  if (detectSqlInjection(input)) {
    threats.push('SQL_INJECTION')
    
    await logAudit({
      action: AuditAction.SECURITY_VIOLATION,
      severity: AuditSeverity.CRITICAL,
      description: 'SQL injection attempt detected',
      userId: context.userId,
      organizationId: context.organizationId,
      metadata: {
        alertType: SecurityAlertType.SQL_INJECTION_ATTEMPT,
        endpoint: context.endpoint,
        inputSnippet: input.substring(0, 100),
      }
    })
  }
  
  if (detectXss(input)) {
    threats.push('XSS')
    
    await logAudit({
      action: AuditAction.SECURITY_VIOLATION,
      severity: AuditSeverity.HIGH,
      description: 'XSS attempt detected',
      userId: context.userId,
      organizationId: context.organizationId,
      metadata: {
        alertType: SecurityAlertType.XSS_ATTEMPT,
        endpoint: context.endpoint,
        inputSnippet: input.substring(0, 100),
      }
    })
  }
  
  return {
    isSecure: threats.length === 0,
    threats
  }
}

/**
 * Check for unusual access patterns
 */
export async function detectUnusualAccess(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  // Check if user has accessed this resource type unusually frequently
  const key = `access:${userId}:${resourceType}`
  const { count } = trackEvent(key, 60 * 60 * 1000) // 1 hour window
  
  // Flag if accessing more than 100 different resources of same type in an hour
  if (count > 100) {
    await logAudit({
      action: AuditAction.SUSPICIOUS_ACTIVITY,
      severity: AuditSeverity.MEDIUM,
      description: `Unusual access pattern detected for user ${userId}`,
      userId,
      metadata: {
        alertType: SecurityAlertType.UNUSUAL_DATA_ACCESS,
        resourceType,
        accessCount: count,
      }
    })
    return true
  }
  
  return false
}

/**
 * Get security dashboard metrics
 */
export async function getSecurityMetrics(organizationId: string): Promise<{
  threatsBlocked: number
  failedLogins: number
  activeAlerts: number
  riskScore: number
  recentIncidents: Array<{
    type: string
    severity: string
    timestamp: Date
    description: string
  }>
}> {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  const [securityViolations, failedLogins, criticalEvents] = await Promise.all([
    prisma.auditLog.count({
      where: {
        organizationId,
        action: AuditAction.SECURITY_VIOLATION,
        createdAt: { gte: last24Hours }
      }
    }),
    prisma.auditLog.count({
      where: {
        organizationId,
        action: AuditAction.LOGIN_FAILED,
        createdAt: { gte: last24Hours }
      }
    }),
    prisma.auditLog.findMany({
      where: {
        organizationId,
        severity: { in: [AuditSeverity.HIGH, AuditSeverity.CRITICAL] },
        createdAt: { gte: last24Hours }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
  ])
  
  // Calculate risk score (0-100)
  const riskScore = Math.min(100, Math.max(0,
    100 - (securityViolations * 10) - (failedLogins * 2) - (criticalEvents.length * 15)
  ))
  
  return {
    threatsBlocked: securityViolations,
    failedLogins,
    activeAlerts: criticalEvents.length,
    riskScore,
    recentIncidents: criticalEvents.map(event => ({
      type: event.action,
      severity: event.severity,
      timestamp: event.createdAt,
      description: event.description,
    }))
  }
}

/**
 * Auto-block suspicious IPs
 */
export async function autoBlockSuspiciousIp(ipAddress: string, reason: string): Promise<void> {
  // In production, this would:
  // 1. Add IP to firewall blocklist
  // 2. Notify security team
  // 3. Create persistent block record
  
  await logAudit({
    action: AuditAction.SECURITY_VIOLATION,
    severity: AuditSeverity.CRITICAL,
    description: `IP auto-blocked: ${reason}`,
    metadata: {
      ipAddress,
      reason,
      autoBlocked: true,
    }
  })
  
  console.error('AUTO_BLOCK_IP:', JSON.stringify({
    timestamp: new Date().toISOString(),
    ipAddress,
    reason,
  }))
}
