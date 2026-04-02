import { z } from 'zod'

/**
 * Input Validation Schemas
 * Comprehensive validation for all API inputs using Zod
 */

// ============ Common Validations ============

export const uuidSchema = z.string().uuid('Invalid UUID format')

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
})

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()),
})

// ============ User Validations ============

export const userRoleSchema = z.enum(['OWNER', 'ADMIN', 'ANALYST', 'VIEWER'])

export const userProfileSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[\p{L}\s'-]+$/u, 'Name can only contain letters, spaces, hyphens and apostrophes'),
  email: z.string().email('Invalid email address').max(255),
})

export const passwordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character')

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: passwordSchema,
  confirmPassword: z.string(),
  organizationName: z.string().min(2).max(100).optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// ============ Organization Validations ============

export const organizationSchema = z.object({
  name: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters'),
  sector: z.enum([
    'PUBLIC_SECTOR',
    'PRIVATE_SECTOR',
    'NGO',
    'HEALTHCARE',
    'EDUCATION',
    'FINANCE',
    'AGRICULTURE',
    'ENERGY',
    'TELECOMMUNICATIONS',
    'TRANSPORT',
    'OTHER'
  ]),
  country: z.string().min(2).max(100),
  size: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'ENTERPRISE']),
  website: z.string().url().optional().or(z.literal('')),
  description: z.string().max(500).optional(),
})

export const organizationUpdateSchema = organizationSchema.partial()

export const teamMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: userRoleSchema,
})

export const teamMemberUpdateSchema = z.object({
  role: userRoleSchema,
})

// ============ Dataset Validations ============

export const datasetCreateSchema = z.object({
  name: z.string()
    .min(2, 'Dataset name must be at least 2 characters')
    .max(100, 'Dataset name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9_\-\s]+$/, 'Dataset name can only contain letters, numbers, spaces, underscores and hyphens'),
  description: z.string().max(1000).optional(),
  sector: z.string().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  isPublic: z.boolean().default(false),
})

export const datasetUpdateSchema = datasetCreateSchema.partial()

export const datasetFilterSchema = paginationSchema.extend({
  search: z.string().max(100).optional(),
  sector: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
  tags: z.string().optional(), // Comma-separated tags
})

// ============ KPI Validations ============

export const kpiTypeSchema = z.enum([
  'NUMBER',
  'PERCENTAGE',
  'CURRENCY',
  'RATIO',
  'TIME',
  'COUNT'
])

export const kpiCreateSchema = z.object({
  name: z.string()
    .min(2, 'KPI name must be at least 2 characters')
    .max(100, 'KPI name must be less than 100 characters'),
  description: z.string().max(500).optional(),
  datasetId: uuidSchema,
  type: kpiTypeSchema,
  value: z.number(),
  target: z.number().optional(),
  unit: z.string().max(20).optional(),
  frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  category: z.string().max(50).optional(),
  tags: z.array(z.string().max(30)).max(5).optional(),
})

export const kpiUpdateSchema = kpiCreateSchema.partial().omit({ datasetId: true })

// ============ API Key Validations ============

export const apiKeyCreateSchema = z.object({
  name: z.string()
    .min(2, 'API key name must be at least 2 characters')
    .max(50, 'API key name must be less than 50 characters'),
  expiresInDays: z.coerce.number()
    .int()
    .min(1, 'Expiration must be at least 1 day')
    .max(365, 'Expiration cannot exceed 365 days')
    .optional(),
  permissions: z.array(z.enum(['READ', 'WRITE', 'ADMIN'])).min(1).default(['READ']),
})

// ============ AI Validations ============

export const aiAnalyzeSchema = z.object({
  fileId: uuidSchema.optional(),
  prompt: z.string()
    .min(10, 'Prompt must be at least 10 characters')
    .max(4000, 'Prompt must be less than 4000 characters')
    .optional(),
  analysisType: z.enum(['SUMMARY', 'TRENDS', 'ANOMALIES', 'PREDICTIONS', 'COMPARISON']).default('SUMMARY'),
})

export const aiChatSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message must be less than 2000 characters'),
  conversationId: uuidSchema.optional(),
  context: z.record(z.string(), z.unknown()).optional(),
})

// ============ File Upload Validations ============

export const ALLOWED_FILE_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/json',
  'application/pdf',
  'text/plain',
] as const

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export const fileUploadSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename must be less than 255 characters')
    .regex(/^[\w\-. ]+$/, 'Invalid filename format'),
  mimetype: z.enum(ALLOWED_FILE_TYPES, {
    errorMap: () => ({ message: 'Invalid file type. Allowed: CSV, Excel, JSON, PDF, TXT' })
  }),
  size: z.number()
    .min(1, 'File cannot be empty')
    .max(MAX_FILE_SIZE, 'File size cannot exceed 50MB'),
})

// ============ Webhook Validations ============

export const webhookCreateSchema = z.object({
  url: z.string().url('Invalid URL format'),
  events: z.array(z.string()).min(1, 'At least one event must be selected'),
  secret: z.string().min(16, 'Secret must be at least 16 characters').optional(),
  isActive: z.boolean().default(true),
})

// ============ Comment Validations ============

export const commentCreateSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be less than 2000 characters'),
  resourceId: uuidSchema,
  resourceType: z.enum(['DATASET', 'KPI', 'REPORT', 'DASHBOARD']),
})

// ============ Notification Validations ============

export const notificationUpdateSchema = z.object({
  read: z.boolean(),
})

// ============ Export Validations ============

export const exportSchema = z.object({
  format: z.enum(['PDF', 'CSV', 'EXCEL', 'JSON']),
  resourceType: z.enum(['DATASET', 'KPI', 'REPORT', 'DASHBOARD']),
  resourceId: uuidSchema,
  includeCharts: z.boolean().default(true),
  dateRange: dateRangeSchema.optional(),
})

// ============ Sanitization Utilities ============

/**
 * Sanitize string input by removing potential XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null) {
      result[key] = Array.isArray(value) 
        ? value.map(item => typeof item === 'string' ? sanitizeString(item) : item)
        : sanitizeObject(value as Record<string, unknown>)
    } else {
      result[key] = value
    }
  }
  
  return result as T
}

/**
 * Validate and sanitize input
 */
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    return { success: false, errors: result.error }
  }
  
  // Sanitize string fields
  if (typeof result.data === 'object' && result.data !== null) {
    return { 
      success: true, 
      data: sanitizeObject(result.data as Record<string, unknown>) as T 
    }
  }
  
  return { success: true, data: result.data }
}
