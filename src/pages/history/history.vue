<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFoodStore } from '@/stores'
import { formatDate } from '@/utils/date'
import type { FoodRecord } from '@/types'

const foodStore = useFoodStore()

const currentDate = ref(new Date())
const records = ref<FoodRecord[]>([])

const selectedDateStr = computed(() => formatDate(currentDate.value))

const selectedCalories = computed(() => {
  return records.value.reduce((sum, r) => sum + (r.calories || 0), 0)
})

onMounted(() => {
  loadRecords()
})

async function loadRecords() {
  const dateStr = selectedDateStr.value
  await foodStore.fetchRecords(dateStr)
  // 拷贝一份，避免引用 store 内部数组导致切换日期时显示错乱
  records.value = foodStore.records.filter((r) => r.date === dateStr).slice()
}

function changeDate(days: number) {
  const date = new Date(currentDate.value)
  date.setDate(date.getDate() + days)
  currentDate.value = date
  loadRecords()
}

function goToday() {
  currentDate.value = new Date()
  loadRecords()
}

function getMealTypeText(type: string): string {
  const map: Record<string, string> = {
    breakfast: '早餐',
    lunch: '午餐',
    dinner: '晚餐',
    snack: '加餐',
  }
  return map[type] || type
}

function getMealTypeIcon(type: string): string {
  const map: Record<string, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍪',
  }
  return map[type] || '🍽️'
}

function formatRecordTime(record: FoodRecord): string {
  if (!record.createdAt) return ''
  return formatDate(record.createdAt, 'HH:mm')
}

async function deleteRecord(id: string) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条记录吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await foodStore.deleteRecord(id)
          await loadRecords()
        } catch {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    },
  })
}
</script>

<template>
  <view class="container">
    <view class="date-picker">
      <view class="arrow" @tap="changeDate(-1)">
        <text>&lt;</text>
      </view>
      <view class="current-date" @tap="goToday">
        <text class="date-text">{{ formatDate(currentDate, 'MM月DD日') }}</text>
        <text class="today-tag" v-if="selectedDateStr === formatDate(new Date())">今天</text>
      </view>
      <view class="arrow" @tap="changeDate(1)">
        <text>&gt;</text>
      </view>
    </view>

    <view class="summary-card">
      <view class="summary-item">
        <text class="value">{{ selectedCalories }}</text>
        <text class="label">总热量(千卡)</text>
      </view>
      <view class="divider"></view>
      <view class="summary-item">
        <text class="value">{{ records.length }}</text>
        <text class="label">记录数</text>
      </view>
    </view>

    <view class="records-list" v-if="records.length > 0">
      <view class="record-card" v-for="record in records" :key="record._id">
        <view class="record-icon">
          <text>{{ getMealTypeIcon(record.mealType) }}</text>
        </view>
        <view class="record-info">
          <view class="record-header">
            <text class="food-name">{{ record.foodName }}</text>
            <text class="meal-type">{{ getMealTypeText(record.mealType) }}</text>
          </view>
          <view class="record-details">
            <text class="calories">{{ record.calories }} 千卡</text>
            <text class="time">{{ formatRecordTime(record) }}</text>
          </view>
        </view>
        <view class="record-action" @tap="deleteRecord(record._id)">
          <text class="delete-icon">🗑️</text>
        </view>
      </view>
    </view>

    <view class="empty-state" v-else>
      <text class="empty-icon">📝</text>
      <text class="empty-text">暂无记录</text>
      <text class="empty-hint">点击底部"识别"按钮添加食物</text>
    </view>
  </view>
</template>

<style scoped>
.container {
  padding: 20rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

.date-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-radius: 15rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.arrow {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #4caf50;
}

.current-date {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.date-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.today-tag {
  font-size: 20rpx;
  background: #4caf50;
  color: #fff;
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
}

.summary-card {
  display: flex;
  justify-content: space-around;
  align-items: center;
  background: #fff;
  border-radius: 15rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.value {
  font-size: 40rpx;
  font-weight: bold;
  color: #4caf50;
}

.label {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.divider {
  width: 2rpx;
  height: 60rpx;
  background: #e0e0e0;
}

.records-list {
  display: flex;
  flex-direction: column;
  gap: 15rpx;
}

.record-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 15rpx;
  padding: 25rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.record-icon {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  background: #f5f5f5;
  border-radius: 50%;
  margin-right: 20rpx;
}

.record-info {
  flex: 1;
}

.record-header {
  display: flex;
  align-items: center;
  gap: 15rpx;
  margin-bottom: 10rpx;
}

.food-name {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.meal-type {
  font-size: 20rpx;
  background: #e8f5e9;
  color: #4caf50;
  padding: 4rpx 12rpx;
  border-radius: 10rpx;
}

.record-details {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.calories {
  font-size: 24rpx;
  color: #4caf50;
}

.time {
  font-size: 22rpx;
  color: #999;
}

.record-action {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-icon {
  font-size: 32rpx;
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
