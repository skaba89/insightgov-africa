// ============================================
// InsightGov Africa - Tests Utilitaires
// ============================================

import { describe, it, expect } from 'vitest'
import { formatNumber, formatCurrency, formatPercent } from '@/lib/utils'

describe('Utils - formatNumber', () => {
  it('should format small numbers correctly', () => {
    expect(formatNumber(123)).toBe('123')
    expect(formatNumber(0)).toBe('0')
  })

  it('should format large numbers with spaces', () => {
    expect(formatNumber(1000)).toBe('1\u202f000')
    expect(formatNumber(1000000)).toBe('1\u202f000\u202f000')
  })

  it('should handle decimal numbers', () => {
    expect(formatNumber(1234.56)).toBe('1\u202f234,56')
  })

  it('should handle negative numbers', () => {
    expect(formatNumber(-1000)).toBe('-1\u202f000')
  })
})

describe('Utils - formatCurrency', () => {
  it('should format currency in XOF by default', () => {
    const result = formatCurrency(1000)
    expect(result).toContain('1')
    expect(result).toContain('CFA') // XOF is displayed as F CFA
  })

  it('should format currency in EUR', () => {
    const result = formatCurrency(1000, 'EUR')
    expect(result).toContain('1')
    expect(result).toContain('€')
  })

  it('should handle zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
  })
})

describe('Utils - formatPercent', () => {
  it('should format percentages correctly', () => {
    expect(formatPercent(50)).toBe('50.0%')
    expect(formatPercent(33.33)).toBe('33.3%')
  })

  it('should handle 100%', () => {
    expect(formatPercent(100)).toBe('100.0%')
  })

  it('should handle 0%', () => {
    expect(formatPercent(0)).toBe('0.0%')
  })

  it('should respect decimal places', () => {
    expect(formatPercent(33.333, 2)).toBe('33.33%')
    expect(formatPercent(50, 0)).toBe('50%')
  })
})
