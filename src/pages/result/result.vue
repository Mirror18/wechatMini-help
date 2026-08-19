<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useFoodStore, useUserStore } from '@/stores'
import { getToday } from '@/utils/date'
import { estimateNutrition } from '@/utils/nutrition'
import type { BaiduAIDishResult, MealType } from '@/types'

const foodStore = useFoodStore()
const userStore = useUserStore()

const image = ref('')
const results = ref<BaiduAIDishResult[]>([])
const selectedIndex = ref(0)
const mealType = ref<MealType>('lunch')
const saving = ref(false)

onMounted(() => {
  try {
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1] as any
    const raw = currentPage.options?.data || '{}'
    const data = JSON.parse(decodeURIComponent(raw))

    image.value = data.image || ''
    results.value = Array.isArray(data.results) ? data.results : []

    if (!results.value.length) {
      uni.showToast({ title: '无识别结果', icon: 'none' })
    }
  } catch (error) {
    console.error('解析识别结果失败:', error)
    uni.showToast({ title: '页面参数错误', icon: 'none' })
  }
})

const selectedResult = computed(() => results.value[selectedIndex.value])

function selectResult(index: number) {
  selectedIndex.value = index
}

function selectMealType(type: MealType) {
  mealType.value = type
}

/**
 * 将本地临时图片上传到 uniCloud 存储，避免临时路径过期导致历史记录无法展示。
 * H5/小程序均支持 uniCloud.uploadFile。
 */
async function uploadImage(filePath: string): Promise<string> {
  if (!filePath) return ''

  // H5 blob URL 或本地缓存路径直接上传可能失败，先容错返回原路径
  try {
    const ext = filePath.includes('.') ? filePath.split('.').pop() : 'jpg'
    const cloudPath = `food-images/${userStore.openid || 'anonymous'}/${Date.now()}.${ext}`
    const uploadRes = await uniCloud.uploadFile({
      filePath,
      cloudPath,
    })
    return uploadRes.fileID || filePath
  } catch (error) {
    console.warn('图片上传失败，使用原路径:', error)
    return filePath
  }
}

async function handleSave() {
  if (!selectedResult.value) return

  try {
    saving.value = true

    const calories = parseFloat(selectedResult.value.calorie) || 0
    const nutrition = estimateNutrition(selectedResult.value.name, calories)
    const imageUrl = await uploadImage(image.value)

    await foodStore.addRecord({
      userId: userStore.openid,
      foodName: selectedResult.value.name,
      calories,
      protein: nutrition.protein,
      fat: nutrition.fat,
      carbs: nutrition.carbs,
      imageUrl,
      confidence: parseFloat(selectedResult.value.probability) || 0,
      mealType: mealType.value,
      date: getToday(),
    })

    uni.showToast({
      title: '保存成功',
      icon: 'success',
    })

    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (error) {
    console.error('保存失败:', error)
    uni.showToast({
      title: (error as Error).message || '保存失败',
      icon: 'none',
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <view class="container">
    <view class="image-preview">
      <image :src="image" mode="aspectFit" class="preview-image" />
    </view>

    <view class="results-section">
      <view class="section-title">识别结果</view>
      <scroll-view scroll-x class="results-scroll" v-if="results.length > 0">
        <view
          v-for="(item, index) in results"
          :key="index"
          class="result-card"
          :class="{ active: selectedIndex === index }"
          @tap="selectResult(index)"
        >
          <text class="food-name">{{ item.name }}</text>
          <text class="confidence">{{ (parseFloat(item.probability) * 100).toFixed(0) }}%</text>
        </view>
      </scroll-view>
      <view class="empty-tip" v-else>
        <text>未识别到可选结果</text>
      </view>
    </view>

    <view class="detail-card" v-if="selectedResult">
      <view class="detail-header">
        <text class="detail-name">{{ selectedResult.name }}</text>
        <text class="detail-calories"> {{ selectedResult.calorie || '--' }} 千卡/100g </text>
      </view>

      <view class="confidence-bar">
        <text class="label">识别置信度</text>
        <view class="bar-bg">
          <view
            class="bar-fill"
            :style="{ width: parseFloat(selectedResult.probability) * 100 + '%' }"
          ></view>
        </view>
        <text class="value">{{ (parseFloat(selectedResult.probability) * 100).toFixed(1) }}%</text>
      </view>
    </view>

    <view class="meal-section">
      <view class="section-title">选择餐次</view>
      <view class="meal-options">
        <view
          class="meal-option"
          :class="{ active: mealType === 'breakfast' }"
          @tap="selectMealType('breakfast')"
        >
          <text class="icon">🌅</text>
          <text class="text">早餐</text>
        </view>
        <view
          class="meal-option"
          :class="{ active: mealType === 'lunch' }"
          @tap="selectMealType('lunch')"
        >
          <text class="icon">☀️</text>
          <text class="text">午餐</text>
        </view>
        <view
          class="meal-option"
          :class="{ active: mealType === 'dinner' }"
          @tap="selectMealType('dinner')"
        >
          <text class="icon">🌙</text>
          <text class="text">晚餐</text>
        </view>
        <view
          class="meal-option"
          :class="{ active: mealType === 'snack' }"
          @tap="selectMealType('snack')"
        >
          <text class="icon">🍪</text>
          <text class="text">加餐</text>
        </view>
      </view>
    </view>

    <view class="action-area">
      <button class="save-btn" :loading="saving" @tap="handleSave">保存记录</button>
    </view>
  </view>
</template>

<style scoped>
.container {
  padding: 20rpx;
  background: #f5f5f5;
  min-height: 100vh;
}

.image-preview {
  width: 100%;
  height: 400rpx;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 30rpx;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.results-section {
  margin-bottom: 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.results-scroll {
  white-space: nowrap;
}

.result-card {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 30rpx;
  background: #fff;
  border-radius: 15rpx;
  margin-right: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.result-card.active {
  background: #4caf50;
  box-shadow: 0 4rpx 20rpx rgba(76, 175, 80, 0.4);
}

.food-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.result-card.active .food-name {
  color: #fff;
}

.confidence {
  font-size: 22rpx;
  color: #999;
}

.result-card.active .confidence {
  color: rgba(255, 255, 255, 0.8);
}

.empty-tip {
  text-align: center;
  padding: 40rpx 0;
  color: #999;
  font-size: 28rpx;
}

.detail-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.detail-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.detail-calories {
  font-size: 28rpx;
  color: #4caf50;
  font-weight: bold;
}

.confidence-bar {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.label {
  font-size: 24rpx;
  color: #666;
  min-width: 120rpx;
}

.bar-bg {
  flex: 1;
  height: 20rpx;
  background: #e0e0e0;
  border-radius: 10rpx;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4caf50, #8bc34a);
  border-radius: 10rpx;
}

.value {
  font-size: 24rpx;
  color: #333;
  min-width: 80rpx;
  text-align: right;
}

.meal-section {
  margin-bottom: 40rpx;
}

.meal-options {
  display: flex;
  justify-content: space-between;
}

.meal-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  background: #fff;
  border-radius: 15rpx;
  flex: 1;
  margin-right: 15rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.meal-option:last-child {
  margin-right: 0;
}

.meal-option.active {
  background: #e8f5e9;
  border: 2rpx solid #4caf50;
}

.icon {
  font-size: 40rpx;
  margin-bottom: 10rpx;
}

.text {
  font-size: 24rpx;
  color: #333;
}

.action-area {
  padding: 20rpx 0;
}

.save-btn {
  width: 100%;
  height: 100rpx;
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
  border-radius: 50rpx;
  border: none;
  box-shadow: 0 4rpx 20rpx rgba(76, 175, 80, 0.4);
}

.save-btn::after {
  border: none;
}
</style>
