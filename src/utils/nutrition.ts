export interface NutritionEstimate {
  protein: number
  fat: number
  carbs: number
}

// 常见中餐菜品每 100g 营养素参考值（单位：g）
// 数据来源：中国食物成分表标准版 / 公开营养数据库，仅作估算
const FOOD_DATABASE: Record<string, NutritionEstimate> = {
  米饭: { protein: 2.6, fat: 0.3, carbs: 25.9 },
  炒饭: { protein: 5.0, fat: 8.0, carbs: 28.0 },
  面条: { protein: 4.5, fat: 0.8, carbs: 28.0 },
  馒头: { protein: 7.0, fat: 1.1, carbs: 47.0 },
  包子: { protein: 7.0, fat: 6.0, carbs: 35.0 },
  饺子: { protein: 7.0, fat: 8.0, carbs: 25.0 },
  油条: { protein: 6.0, fat: 22.0, carbs: 42.0 },
  煎饼: { protein: 6.0, fat: 8.0, carbs: 40.0 },
  鸡蛋: { protein: 13.0, fat: 11.0, carbs: 1.1 },
  煎蛋: { protein: 13.0, fat: 15.0, carbs: 1.2 },
  西红柿炒鸡蛋: { protein: 6.0, fat: 10.0, carbs: 5.0 },
  番茄炒蛋: { protein: 6.0, fat: 10.0, carbs: 5.0 },
  青菜: { protein: 1.5, fat: 0.3, carbs: 3.0 },
  西兰花: { protein: 2.8, fat: 0.4, carbs: 7.0 },
  土豆丝: { protein: 2.0, fat: 8.0, carbs: 15.0 },
  红烧肉: { protein: 12.0, fat: 35.0, carbs: 8.0 },
  糖醋排骨: { protein: 15.0, fat: 25.0, carbs: 20.0 },
  宫保鸡丁: { protein: 16.0, fat: 12.0, carbs: 10.0 },
  麻婆豆腐: { protein: 8.0, fat: 12.0, carbs: 6.0 },
  鱼香肉丝: { protein: 12.0, fat: 15.0, carbs: 12.0 },
  水煮鱼: { protein: 15.0, fat: 18.0, carbs: 3.0 },
  酸菜鱼: { protein: 14.0, fat: 16.0, carbs: 5.0 },
  烤鸡: { protein: 20.0, fat: 10.0, carbs: 0 },
  牛排: { protein: 22.0, fat: 15.0, carbs: 0 },
  汉堡: { protein: 12.0, fat: 14.0, carbs: 30.0 },
  披萨: { protein: 11.0, fat: 12.0, carbs: 32.0 },
  寿司: { protein: 6.0, fat: 2.0, carbs: 28.0 },
  沙拉: { protein: 3.0, fat: 4.0, carbs: 6.0 },
  水果沙拉: { protein: 1.0, fat: 0.5, carbs: 12.0 },
  酸奶: { protein: 3.3, fat: 3.2, carbs: 4.8 },
  牛奶: { protein: 3.0, fat: 3.2, carbs: 4.8 },
  豆浆: { protein: 3.0, fat: 1.6, carbs: 1.8 },
  咖啡: { protein: 0.1, fat: 0.1, carbs: 0.5 },
  奶茶: { protein: 2.0, fat: 4.0, carbs: 18.0 },
  可乐: { protein: 0, fat: 0, carbs: 10.6 },
  蛋糕: { protein: 5.0, fat: 15.0, carbs: 50.0 },
  面包: { protein: 8.0, fat: 4.0, carbs: 50.0 },
  饼干: { protein: 6.0, fat: 20.0, carbs: 65.0 },
  巧克力: { protein: 5.0, fat: 30.0, carbs: 60.0 },
  冰淇淋: { protein: 3.5, fat: 11.0, carbs: 24.0 },
  薯片: { protein: 6.0, fat: 35.0, carbs: 53.0 },
  坚果: { protein: 15.0, fat: 50.0, carbs: 20.0 },
  苹果: { protein: 0.3, fat: 0.2, carbs: 13.8 },
  香蕉: { protein: 1.1, fat: 0.3, carbs: 22.8 },
  橙子: { protein: 0.9, fat: 0.1, carbs: 11.8 },
  葡萄: { protein: 0.7, fat: 0.4, carbs: 16.3 },
  西瓜: { protein: 0.6, fat: 0.2, carbs: 7.6 },
  草莓: { protein: 0.7, fat: 0.3, carbs: 7.7 },
}

// 按热量进行通用估算的宏量营养素比例（蛋白质:脂肪:碳水 ≈ 15:30:55）
const DEFAULT_RATIO: NutritionEstimate = {
  protein: 0.15,
  fat: 0.3,
  carbs: 0.55,
}

/**
 * 根据食物名称和每 100g 热量估算三大营养素。
 * @param foodName 菜品名称
 * @param caloriesPer100g 每 100g 热量（千卡）
 * @returns 每 100g 蛋白质/脂肪/碳水（g）
 */
export function estimateNutrition(foodName: string, caloriesPer100g: number): NutritionEstimate {
  const matched = FOOD_DATABASE[foodName.trim()]
  if (matched) {
    return { ...matched }
  }

  // 热量转营养素的通用经验公式：
  // 蛋白质 ≈ 热量 * 0.15 / 4，脂肪 ≈ 热量 * 0.30 / 9，碳水 ≈ 热量 * 0.55 / 4
  return {
    protein: Math.round(((caloriesPer100g * DEFAULT_RATIO.protein) / 4) * 10) / 10,
    fat: Math.round(((caloriesPer100g * DEFAULT_RATIO.fat) / 9) * 10) / 10,
    carbs: Math.round(((caloriesPer100g * DEFAULT_RATIO.carbs) / 4) * 10) / 10,
  }
}
