<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFoodStore, useUserStore } from '@/stores'
import { chooseImage, compressImage } from '@/utils/image'
import { getToday } from '@/utils/date'
import { recognizeDish, imageToBase64 } from '@/api/baidu-ai'

const foodStore = useFoodStore()
const userStore = useUserStore()

const loading = ref(false)
const todayCalories = computed(() => foodStore.todayCalories)
const calorieGoal = computed(() => userStore.profile?.dailyCalorieGoal || 2000)
const progress = computed(() => Math.min(todayCalories.value / calorieGoal.value * 100, 100))

onMounted(async () => {
  await foodStore.fetchRecords(getToday())
})

async function handleTakePhoto() {
  try {
    loading.value = true
    
    const [tempFilePath] = await chooseImage()
    const compressedPath = await compressImage(tempFilePath, 80)
    const base64 = await imageToBase64(compressedPath)
    
    const result = await recognizeDish(base64)
    
    if (result.result && result.result.length > 0) {
      uni.navigateTo({
        url: `/pages/result/result?data=${encodeURIComponent(JSON.stringify({
          image: compressedPath,
          results: result.result
        }))}`
      })
    } else {
      uni.showToast({
        title: '未识别到食物',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('识别失败:', error)
    uni.showToast({
      title: '识别失败，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="container">
    <view class="header">
      <view class="greeting">
        <text class="title">今日热量</text>
        <text class="date">{{ getToday() }}</text>
      </view>
      
      <view class="calorie-card">
        <view class="calorie-circle">
          <text class="calorie-number">{{ todayCalories }}</text>
          <text class="calorie-unit">千卡</text>
        </view>
        <view class="progress-bar">
          <view class="progress-fill" :style="{ width: progress + '%' }"></view>
        </view>
        <text class="goal-text">目标: {{ calorieGoal }} 千卡</text>
      </view>
    </view>
    
    <view class="nutrition-summary">
      <view class="nutrition-item">
        <text class="value">{{ foodStore.todayNutrition.protein.toFixed(1) }}</text>
        <text class="label">蛋白质(g)</text>
      </view>
      <view class="nutrition-item">
        <text class="value">{{ foodStore.todayNutrition.fat.toFixed(1) }}</text>
        <text class="label">脂肪(g)</text>
      </view>
      <view class="nutrition-item">
        <text class="value">{{ foodStore.todayNutrition.carbs.toFixed(1) }}</text>
        <text class="label">碳水(g)</text>
      </view>
    </view>
    
    <view class="action-area">
      <button 
        class="capture-btn" 
        :loading="loading" 
        @tap="handleTakePhoto"
      >
        <text class="btn-icon">📸</text>
        <text class="btn-text">拍照识别食物</text>
      </button>
    </view>
    
    <view class="today-records" v-if="foodStore.todayRecords.length > 0">
      <view class="section-title">今日记录</view>
      <view 
        class="record-item" 
        v-for="record in foodStore.todayRecords" 
        :key="record._id"
      >
        <view class="record-info">
          <text class="food-name">{{ record.foodName }}</text>
          <text class="meal-type">{{ record.mealType }}</text>
        </view>
        <text class="record-calories">{{ record.calories }} 千卡</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.container {
  padding: 20rpx;
  background: linear-gradient(180deg, #4CAF50 0%, #F5F5F5 40%);
  min-height: 100vh;
}

.header {
  padding: 20rpx 0;
}

.greeting {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.title {
  font-size: 40rpx;
  font-weight: bold;
  color: #fff;
}

.date {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

.calorie-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.calorie-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30rpx;
}

.calorie-number {
  font-size: 80rpx;
  font-weight: bold;
  color: #4CAF50;
}

.calorie-unit {
  font-size: 28rpx;
  color: #666;
}

.progress-bar {
  height: 20rpx;
  background: #E0E0E0;
  border-radius: 10rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #8BC34A);
  border-radius: 10rpx;
  transition: width 0.3s ease;
}

.goal-text {
  font-size: 24rpx;
  color: #999;
  text-align: center;
}

.nutrition-summary {
  display: flex;
  justify-content: space-around;
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-top: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.nutrition-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.value {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.label {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.action-area {
  margin-top: 40rpx;
  display: flex;
  justify-content: center;
}

.capture-btn {
  width: 400rpx;
  height: 400rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #4CAF50, #2E7D32);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 30rpx rgba(76, 175, 80, 0.4);
  border: none;
}

.capture-btn::after {
  border: none;
}

.btn-icon {
  font-size: 80rpx;
  margin-bottom: 10rpx;
}

.btn-text {
  font-size: 28rpx;
  color: #fff;
}

.today-records {
  margin-top: 40rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F0F0F0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-info {
  display: flex;
  flex-direction: column;
}

.food-name {
  font-size: 28rpx;
  color: #333;
}

.meal-type {
  font-size: 22rpx;
  color: #999;
  margin-top: 6rpx;
}

.record-calories {
  font-size: 28rpx;
  color: #4CAF50;
  font-weight: bold;
}
</style>
