import { getServerSession } from 'next-auth'
import { prisma } from './db'
import { NextRequest } from 'next/server'

/**
 * Audit Logging System
 * Provides comprehensive security event logging with database persistence
 */

export enum AuditAction {
  // Authentication events
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  PASSWORD_RESET = 'PASSWORD_RESET',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',
  
  // User management
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  USER_ROLE_CHANGE = 'USER_ROLE_CHANGE',
  
  // Organization events
  ORG_CREATE = 'ORG_CREATE',
  ORG_UPDATE = 'ORG_UPDATE',
  ORG_DELETE = 'ORG_DELETE',
  ORG_MEMBER_ADD = 'ORG_MEMBER_ADD',
  ORG_MEMBER_REMOVE = 'ORG_MEMBER_REMOVE',
  
  // Data events
  DATASET_CREATE = 'DATASET_CREATE',
  DATASET_UPDATE = 'DATASET_UPDATE',
  DATASET_DELETE = 'DATASET_DELETE',
  DATASET_EXPORT = 'DATASET_EXPORT',
  DATASET_UPLOAD = 'DATASET_UPLOAD',
  
  KPI_CREATE = 'KPI_CREATE',
  KPI_UPDATE = 'KPI_UPDATE',
  KPI_DELETE = 'KPI_DELETE',
  
  // API events
  API_KEY_CREATE = 'API_KEY_CREATE',
  API_KEY_DELETE = 'API_KEY_DELETE',
  API_KEY_USED = 'API_KEY_USED',
  
  // Security events
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CSRF_VIOLATION = 'CSRF_VIOLATION',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  
  // AI events
  AI_ANALYSIS = 'AI_ANALYSIS',
  AI_CHAT = 'AI_CHAT',
  AI_INSIGHT = 'AI_INSIGHT',
  
  // System events
  SYSTEM_CONFIG_CHANGE = 'SYSTEM_CONFIG_CHANGE',
  WEBHOOK_TRIGGERED = 'WEBHOOK_TRIGGERED',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AuditLogData {
  action: AuditAction
  severity?: AuditSeverity
  description: string
  resourceId?: string
  resourceType?: string
  metadata?: Record<string, unknown>
  request?: NextRequest
  userId?: string
  organizationId?: string
}

export interface AuditLogEntry {
  id: string
  timestamp: Date
  action: AuditAction
  severity: AuditSeverity
  description: string
  userId: string | null
  organizationId: string | null
  resourceId: string | null
  resourceType: string | null
  ipAddress: string | null
  userAgent: string | null
  metadata: Record<string, unknown>
}

/**
 * Get client IP from request
 */
function getClientIP(request?: NextRequest): string | null {
  if (!request) return null
  
  return request.ip ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    null
}

/**
 * Get user agent from request
 */
function getUserAgent(request?: NextRequest): string | null {
  if (!request) return null
  return request.headers.get('user-agent')
}

/**
 * Determine severity based on action
 */
function getDefaultSeverity(action: AuditAction): AuditSeverity {
  const severityMap: Partial<Record<AuditAction, AuditSeverity>> = {
    [AuditAction.LOGIN_FAILED]: AuditSeverity.MEDIUM,
    [AuditAction.SECURITY_VIOLATION]: AuditSeverity.HIGH,
    [AuditAction.RATE_LIMIT_EXCEEDED]: AuditSeverity.MEDIUM,
    [AuditAction.CSRF_VIOLATION]: AuditSeverity.HIGH,
    [AuditAction.SUSPICIOUS_ACTIVITY]: AuditSeverity.HIGH,
    [AuditAction.UNAUTHORIZED_ACCESS]: AuditSeverity.HIGH,
    [AuditAction.PASSWORD_CHANGE]: AuditSeverity.MEDIUM,
    [AuditAction.USER_DELETE]: AuditSeverity.HIGH,
    [AuditAction.ORG_DELETE]: AuditSeverity.CRITICAL,
    [AuditAction.DATASET_DELETE]: AuditSeverity.MEDIUM,
    [AuditAction.API_KEY_CREATE]: AuditSeverity.MEDIUM,
    [AuditAction.API_KEY_DELETE]: AuditSeverity.HIGH,
  }
  
  return severityMap[action] || AuditSeverity.LOW
}

/**
 * Log an audit event
 */
export async function logAudit(data: AuditLogData): Promise<void> {
  try {
    const severity = data.severity || getDefaultSeverity(data.action)
    const ipAddress = getClientIP(data.request)
    const userAgent = getUserAgent(data.request)
    
    // Get current user from session if not provided
    let userId = data.userId
    let organizationId = data.organizationId
    
    if (!userId) {
      const session = await getServerSession()
      userId = session?.user?.id || null
      organizationId = session?.user?.organizationId || null
    }
    
    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        action: data.action,
        severity,
        description: data.description,
        userId,
        organizationId,
        resourceId: data.resourceId,
        resourceType: data.resourceType,
        ipAddress,
        userAgent,
        metadata: data.metadata || {},
      }
    })
    
    // Log to console for real-time monitoring
    console.log(JSON.stringify({
      type: 'AUDIT_LOG',
      timestamp: new Date().toISOString(),
      action: data.action,
      severity,
      description: data.description,
      userId,
      organizationId,
      ipAddress,
      resourceId: data.resourceId,
    }))
    
    // Trigger alerts for high severity events
    if (severity === AuditSeverity.HIGH || severity === AuditSeverity.CRITICAL) {
      await triggerSecurityAlert({
        action: data.action,
        severity,
        description: data.description,
        userId,
        organizationId,
        ipAddress,
      })
    }
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('Audit logging failed:', error)
  }
}

/**
 * Trigger security alert for high severity events
 */
async function triggerSecurityAlert(data: {
  action: AuditAction
  severity: AuditSeverity
  description: string
  userId?: string | null
  organizationId?: string | null
  ipAddress?: string | null
}): Promise<void> {
  // In production, this would send to:
  // - Slack/Teams webhook
  // - Email alerts
  // - Security monitoring service (e.g., Sentry, Datadog)
  
  console.error('SECURITY_ALERT:', JSON.stringify({
    timestamp: new Date().toISOString(),
    ...data
  }))
}

/**
 * Get audit logs for an organization
 */
export async function getAuditLogs(params: {
  organizationId: string
  userId?: string
  action?: AuditAction
  severity?: AuditSeverity
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}): Promise<{ logs: AuditLogEntry[]; total: number }> {
  const where: any = {
    organizationId: params.organizationId
  }
  
  if (params.userId) where.userId = params.userId
  if (params.action) where.action = params.action
  if (params.severity) where.severity = params.severity
  if (params.startDate || params.endDate) {
    where.createdAt = {}
    if (params.startDate) where.createdAt.gte = params.startDate
    if (params.endDate) where.createdAt.lte = params.endDate
  }
  
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: params.limit || 50,
      skip: params.offset || 0,
    }),
    prisma.auditLog.count({ where })
  ])
  
  return {
    logs: logs.map(log => ({
      id: log.id,
      timestamp: log.createdAt,
      action: log.action as AuditAction,
      severity: log.severity as AuditSeverity,
      description: log.description,
      userId: log.userId,
      organizationId: log.organizationId,
      resourceId: log.resourceId,
      resourceType: log.resourceType,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      metadata: log.metadata as Record<string, unknown>,
    })),
    total
  }
}

/**
 * Get security summary for dashboard
 */
export async function getSecuritySummary(organizationId: string): Promise<{
  totalEvents: number
  failedLogins: number
  securityViolations: number
  recentCriticalEvents: number
}> {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
  
  const [totalEvents, failedLogins, securityViolations, recentCriticalEvents] = await Promise.all([
    prisma.auditLog.count({ where: { organizationId } }),
    prisma.auditLog.count({
      where: { organizationId, action: AuditAction.LOGIN_FAILED, createdAt: { gte: last24Hours } }
    }),
    prisma.auditLog.count({
      where: { organizationId, action: AuditAction.SECURITY_VIOLATION, createdAt: { gte: last24Hours } }
    }),
    prisma.auditLog.count({
      where: { organizationId, severity: AuditSeverity.CRITICAL, createdAt: { gte: last24Hours } }
    }),
  ])
  
  return { totalEvents, failedLogins, securityViolations, recentCriticalEvents }
}
