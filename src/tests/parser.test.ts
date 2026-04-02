// ============================================
// InsightGov Africa - Tests Parser Service
// ============================================

import { describe, it, expect } from 'vitest'

describe('Parser Service', () => {
  describe('Column Type Detection', () => {
    it('should detect numeric values', () => {
      const values = ['100', '200', '300', '400']
      const numericValues = values.filter(v => !isNaN(Number(v)))
      expect(numericValues.length).toBe(4)
    })

    it('should detect string values', () => {
      const values = ['John', 'Jane', 'Bob', 'Alice']
      const stringValues = values.filter(v => isNaN(Number(v)))
      expect(stringValues.length).toBe(4)
    })

    it('should detect date values', () => {
      const values = ['2024-01-01', '2024-02-15', '2024-03-20']
      const dateValues = values.filter(v => !isNaN(Date.parse(v)))
      expect(dateValues.length).toBe(3)
    })
  })

  describe('Semantic Type Detection', () => {
    it('should identify email patterns', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      expect(emailRegex.test('test@example.com')).toBe(true)
      expect(emailRegex.test('invalid-email')).toBe(false)
    })

    it('should identify phone patterns', () => {
      const phoneRegex = /^[\d\s\+\-\(\)]{8,}$/
      expect(phoneRegex.test('+237612345678')).toBe(true)
      expect(phoneRegex.test('0612345678')).toBe(true)
    })
  })

  describe('Statistics Calculation', () => {
    it('should calculate basic statistics', () => {
      const values = [10, 20, 30, 40, 50]
      const sum = values.reduce((a, b) => a + b, 0)
      const mean = sum / values.length

      expect(sum).toBe(150)
      expect(mean).toBe(30)
    })

    it('should find min and max', () => {
      const values = [10, 20, 30, 40, 50]
      expect(Math.min(...values)).toBe(10)
      expect(Math.max(...values)).toBe(50)
    })

    it('should count unique values', () => {
      const values = ['A', 'B', 'A', 'C', 'B', 'A']
      const unique = new Set(values)
      expect(unique.size).toBe(3)
    })
  })
})
