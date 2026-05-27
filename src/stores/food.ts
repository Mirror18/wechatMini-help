import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { FoodRecord, FoodStats } from '@/types'

export const useFoodStore = defineStore('food', () => {
  const records = ref<FoodRecord[]>([])
  const todayRecords = computed(() => {
    const today = new Date().toISOString().split('T')[0]
    return records.value.filter((r) => r.date === today)
  })

  const todayCalories = computed(() => todayRecords.value.reduce((sum, r) => sum + r.calories, 0))

  const todayNutrition = computed(() => ({
    protein: todayRecords.value.reduce((sum, r) => sum + r.protein, 0),
    fat: todayRecords.value.reduce((sum, r) => sum + r.fat, 0),
    carbs: todayRecords.value.reduce((sum, r) => sum + r.carbs, 0),
  }))

  const loading = ref(false)

  async function addRecord(record: Omit<FoodRecord, '_id' | 'createdAt'>) {
    try {
      loading.value = true
      const { result } = await uniCloud.callFunction({
        name: 'food-record',
        data: {
          action: 'add',
          record,
        },
      })

      await fetchRecords(record.date)
      return result._id
    } catch (error) {
      console.error('添加记录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchRecords(date: string) {
    try {
      loading.value = true
      const { result } = await uniCloud.callFunction({
        name: 'food-record',
        data: {
          action: 'list',
          date,
        },
      })

      records.value = result
    } catch (error) {
      console.error('获取记录失败:', error)
    } finally {
      loading.value = false
    }
  }

  async function deleteRecord(id: string) {
    try {
      loading.value = true
      await uniCloud.callFunction({
        name: 'food-record',
        data: {
          action: 'delete',
          id,
        },
      })

      records.value = records.value.filter((r) => r._id !== id)
    } catch (error) {
      console.error('删除记录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function getStats(startDate: string, endDate: string): Promise<FoodStats> {
    try {
      const { result } = await uniCloud.callFunction({
        name: 'food-record',
        data: {
          action: 'stats',
          startDate,
          endDate,
        },
      })

      return result
    } catch (error) {
      console.error('获取统计失败:', error)
      throw error
    }
  }

  return {
    records,
    todayRecords,
    todayCalories,
    todayNutrition,
    loading,
    addRecord,
    fetchRecords,
    deleteRecord,
    getStats,
  }
})
