<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFoodStore } from '@/stores'
import { formatDate, getWeekRange, getMonthRange } from '@/utils/date'
import type { FoodStats } from '@/types'

const foodStore = useFoodStore()

const period = ref<'week' | 'month'>('week')
const stats = ref<FoodStats | null>(null)
const loading = ref(false)

onMounted(() => {
  loadStats()
})

async function loadStats() {
  try {
    loading.value = true
    let startDate: string
    let endDate: string

    if (period.value === 'week') {
      const range = getWeekRange()
      startDate = range.start
      endDate = range.end
    } else {
      const range = getMonthRange()
      startDate = range.start
      endDate = range.end
    }

    stats.value = await foodStore.getStats(startDate, endDate)
  } catch (error) {
    console.error('获取统计失败:', error)
  } finally {
    loading.value = false
  }
}

function switchPeriod(p: 'week' | 'month') {
  period.value = p
  loadStats()
}

function getMaxCalories(): number {
  if (!stats.value?.dailyBreakdown?.length) return 2000
  return Math.max(...stats.value.dailyBreakdown.map((d) => d.calories), 2000)
}

function getBarHeight(calories: number): string {
  const max = getMaxCalories()
  const height = (calories / max) * 200
  return height + 'rpx'
}

function calcNutritionPercent(value: number, total: number): string {
  if (total <= 0) return '0%'
  return (value / total) * 100 + '%'
}
</script>

<template>
  <view class="container">
    <view class="period-tabs">
      <view class="tab" :class="{ active: period === 'week' }" @tap="switchPeriod('week')">
        <text>本周</text>
      </view>
      <view class="tab" :class="{ active: period === 'month' }" @tap="switchPeriod('month')">
        <text>本月</text>
      </view>
    </view>

    <view class="summary-card" v-if="stats">
      <view class="summary-row">
        <view class="summary-item">
          <text class="value">{{ stats.totalCalories }}</text>
          <text class="label">总热量(千卡)</text>
        </view>
        <view class="summary-item">
          <text class="value">{{ stats.avgCalories }}</text>
          <text class="label">日均热量</text>
        </view>
      </view>
      <view class="summary-row">
        <view class="summary-item">
          <text class="value">{{ stats.totalProtein.toFixed(1) }}</text>
          <text class="label">蛋白质(g)</text>
        </view>
        <view class="summary-item">
          <text class="value">{{ stats.totalFat.toFixed(1) }}</text>
          <text class="label">脂肪(g)</text>
        </view>
        <view class="summary-item">
          <text class="value">{{ stats.totalCarbs.toFixed(1) }}</text>
          <text class="label">碳水(g)</text>
        </view>
      </view>
    </view>

    <view class="chart-card" v-if="stats?.dailyBreakdown?.length">
      <view class="chart-title">热量趋势</view>
      <view class="chart-container">
        <view class="chart-bars">
          <view class="bar-group" v-for="item in stats.dailyBreakdown" :key="item.date">
            <view class="bar-value">{{ item.calories }}</view>
            <view class="bar" :style="{ height: getBarHeight(item.calories) }"></view>
            <view class="bar-label">{{ formatDate(item.date, 'MM/DD') }}</view>
          </view>
        </view>
      </view>
    </view>

    <view class="nutrition-card" v-if="stats">
      <view class="card-title">营养成分占比</view>
      <view class="nutrition-bars">
        <view class="nutrition-item">
          <view class="nutrition-header">
            <text class="name">蛋白质</text>
            <text class="value">{{ stats.totalProtein.toFixed(1) }}g</text>
          </view>
          <view class="progress-bar">
            <view
              class="progress-fill protein"
              :style="{
                width: calcNutritionPercent(
                  stats.totalProtein,
                  stats.totalProtein + stats.totalFat + stats.totalCarbs,
                ),
              }"
            ></view>
          </view>
        </view>
        <view class="nutrition-item">
          <view class="nutrition-header">
            <text class="name">脂肪</text>
            <text class="value">{{ stats.totalFat.toFixed(1) }}g</text>
          </view>
          <view class="progress-bar">
            <view
              class="progress-fill fat"
              :style="{
                width: calcNutritionPercent(
                  stats.totalFat,
                  stats.totalProtein + stats.totalFat + stats.totalCarbs,
                ),
              }"
            ></view>
          </view>
        </view>
        <view class="nutrition-item">
          <view class="nutrition-header">
            <text class="name">碳水化合物</text>
            <text class="value">{{ stats.totalCarbs.toFixed(1) }}g</text>
          </view>
          <view class="progress-bar">
            <view
              class="progress-fill carbs"
              :style="{
                width: calcNutritionPercent(
                  stats.totalCarbs,
                  stats.totalProtein + stats.totalFat + stats.totalCarbs,
                ),
              }"
            ></view>
          </view>
        </view>
      </view>
    </view>

    <view class="empty-state" v-if="!stats && !loading">
      <text class="empty-icon">📊</text>
      <text class="empty-text">暂无统计数据</text>
      <text class="empty-hint">开始记录饮食后查看统计</text>
    </view>
  </view>
</template>

<style scoped>
.container {
  padding: 20rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

.period-tabs {
  display: flex;
  background: #fff;
  border-radius: 15rpx;
  padding: 10rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.tab {
  flex: 1;
  text-align: center;
  padding: 15rpx 0;
  border-radius: 10rpx;
  font-size: 28rpx;
  color: #666;
  transition: all 0.3s ease;
}

.tab.active {
  background: #4caf50;
  color: #fff;
}

.summary-card {
  background: #fff;
  border-radius: 15rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.summary-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20rpx;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.value {
  font-size: 36rpx;
  font-weight: bold;
  color: #4caf50;
}

.label {
  font-size: 22rpx;
  color: #999;
  margin-top: 8rpx;
}

.chart-card {
  background: #fff;
  border-radius: 15rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.chart-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.chart-container {
  overflow-x: auto;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 20rpx;
  min-width: 600rpx;
  height: 300rpx;
  padding-bottom: 40rpx;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.bar-value {
  font-size: 20rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.bar {
  width: 40rpx;
  background: linear-gradient(180deg, #4caf50, #8bc34a);
  border-radius: 10rpx 10rpx 0 0;
  min-height: 10rpx;
  transition: height 0.3s ease;
}

.bar-label {
  font-size: 20rpx;
  color: #999;
  margin-top: 10rpx;
}

.nutrition-card {
  background: #fff;
  border-radius: 15rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.card-title {
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.nutrition-bars {
  display: flex;
  flex-direction: column;
  gap: 25rpx;
}

.nutrition-item {
  display: flex;
  flex-direction: column;
}

.nutrition-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.name {
  font-size: 26rpx;
  color: #333;
}

.value {
  font-size: 26rpx;
  color: #666;
}

.progress-bar {
  height: 20rpx;
  background: #e0e0e0;
  border-radius: 10rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 10rpx;
  transition: width 0.3s ease;
}

.protein {
  background: linear-gradient(90deg, #2196f3, #42a5f5);
}

.fat {
  background: linear-gradient(90deg, #ff9800, #ffa726);
}

.carbs {
  background: linear-gradient(90deg, #4caf50, #66bb6a);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #999;
}
</style>
