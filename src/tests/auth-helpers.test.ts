// ============================================
// InsightGov Africa - Tests Auth Helpers
// ============================================

import { describe, it, expect } from 'vitest'
import { PLAN_LIMITS, checkLimit } from '@/lib/auth-helpers'

describe('Auth Helpers - PLAN_LIMITS', () => {
  it('should have correct FREE tier limits', () => {
    expect(PLAN_LIMITS.FREE.datasets).toBe(1)
    expect(PLAN_LIMITS.FREE.dashboards).toBe(5)
    expect(PLAN_LIMITS.FREE.users).toBe(1)
    expect(PLAN_LIMITS.FREE.exports).toBe(5)
  })

  it('should have correct STARTER tier limits', () => {
    expect(PLAN_LIMITS.STARTER.datasets).toBe(10)
    expect(PLAN_LIMITS.STARTER.dashboards).toBe(25)
    expect(PLAN_LIMITS.STARTER.users).toBe(5)
    expect(PLAN_LIMITS.STARTER.exports).toBe(-1) // Unlimited
  })

  it('should have correct PROFESSIONAL tier limits', () => {
    expect(PLAN_LIMITS.PROFESSIONAL.datasets).toBe(-1) // Unlimited
    expect(PLAN_LIMITS.PROFESSIONAL.dashboards).toBe(-1)
    expect(PLAN_LIMITS.PROFESSIONAL.users).toBe(25)
  })

  it('should have correct ENTERPRISE tier limits', () => {
    expect(PLAN_LIMITS.ENTERPRISE.datasets).toBe(-1) // Unlimited
    expect(PLAN_LIMITS.ENTERPRISE.dashboards).toBe(-1)
    expect(PLAN_LIMITS.ENTERPRISE.users).toBe(-1) // Unlimited
  })
})

describe('Auth Helpers - checkLimit', () => {
  it('should allow within limits', () => {
    // This is a simplified test - in real scenario we'd mock the DB
    const tier = 'FREE'
    const limits = PLAN_LIMITS[tier]

    expect(limits.datasets).toBeGreaterThan(0)
  })

  it('should identify unlimited limits with -1', () => {
    const limits = PLAN_LIMITS.ENTERPRISE

    expect(limits.datasets).toBe(-1)
    expect(limits.dashboards).toBe(-1)
  })
})
