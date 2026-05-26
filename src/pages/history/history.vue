<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useFoodStore } from '@/stores'
import { formatDate } from '@/utils/date'
import type { FoodRecord } from '@/types'

const foodStore = useFoodStore()

const currentDate = ref(new Date())
const records = ref<FoodRecord[]>([])

onMounted(() => {
  loadRecords()
})

async function loadRecords() {
  const dateStr = formatDate(currentDate.value)
  await foodStore.fetchRecords(dateStr)
  records.value = foodStore.records
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
    snack: '加餐'
  }
  return map[type] || type
}

function getMealTypeIcon(type: string): string {
  const map: Record<string, string> = {
    breakfast: '🌅',
    lunch: '☀️',
    dinner: '🌙',
    snack: '🍪'
  }
  return map[type] || '🍽️'
}

async function deleteRecord(id: string) {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条记录吗？',
    success: async (res) => {
      if (res.confirm) {
        await foodStore.deleteRecord(id)
        loadRecords()
      }
    }
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
        <text class="today-tag" v-if="formatDate(currentDate) === formatDate(new Date())">今天</text>
      </view>
      <view class="arrow" @tap="changeDate(1)">
        <text>&gt;</text>
      </view>
    </view>
    
    <view class="summary-card">
      <view class="summary-item">
        <text class="value">{{ foodStore.todayCalories }}</text>
        <text class="label">总热量(千卡)</text>
      </view>
      <view class="divider"></view>
      <view class="summary-item">
        <text class="value">{{ records.length }}</text>
        <text class="label">记录数</text>
      </view>
    </view>
    
    <view class="records-list" v-if="records.length > 0">
      <view 
        class="record-card" 
        v-for="record in records" 
        :key="record._id"
      >
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
            <text class="time">{{ formatDate(record.createdAt, 'HH:mm') }}</text>
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
  background: #F5F5F5;
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
  color: #4CAF50;
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
  background: #4CAF50;
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
  color: #4CAF50;
}

.label {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.divider {
  width: 2rpx;
  height: 60rpx;
  background: #E0E0E0;
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
  background: #F5F5F5;
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
  background: #E8F5E9;
  color: #4CAF50;
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
  color: #4CAF50;
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
