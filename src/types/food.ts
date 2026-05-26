export interface FoodRecord {
  _id: string
  userId: string
  foodName: string
  calories: number
  protein: number
  fat: number
  carbs: number
  imageUrl: string
  confidence: number
  mealType: MealType
  date: string
  createdAt: Date
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface FoodDatabase {
  _id: string
  name: string
  calories: number
  protein: number
  fat: number
  carbs: number
  category: string
}

export interface FoodRecognitionResult {
  name: string
  calorie: string
  probability: string
  hasCalorie: boolean
}

export interface FoodStats {
  totalCalories: number
  avgCalories: number
  totalProtein: number
  totalFat: number
  totalCarbs: number
  dailyBreakdown: {
    date: string
    calories: number
  }[]
}
