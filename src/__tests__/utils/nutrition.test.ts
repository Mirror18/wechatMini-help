import { describe, it, expect } from 'vitest'
import { estimateNutrition } from '@/utils/nutrition'

describe('Nutrition estimation', () => {
  it('returns known values for common foods', () => {
    const rice = estimateNutrition('米饭', 116)
    expect(rice.protein).toBe(2.6)
    expect(rice.carbs).toBe(25.9)
  })

  it('falls back to calorie-based estimation for unknown foods', () => {
    const unknown = estimateNutrition('外星人食物', 200)
    expect(unknown.protein).toBeGreaterThan(0)
    expect(unknown.fat).toBeGreaterThan(0)
    expect(unknown.carbs).toBeGreaterThan(0)
  })
})
