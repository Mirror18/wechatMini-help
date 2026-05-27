<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores'

const userStore = useUserStore()

const showGoalModal = ref(false)
const newGoal = ref('')

onMounted(async () => {
  if (userStore.isLoggedIn) {
    await userStore.fetchProfile()
  }
})

function handleLogin() {
  userStore.login()
}

function openGoalModal() {
  newGoal.value = String(userStore.profile?.dailyCalorieGoal || 2000)
  showGoalModal.value = true
}

async function saveGoal() {
  const goal = parseInt(newGoal.value)
  if (isNaN(goal) || goal <= 0) {
    uni.showToast({
      title: '请输入有效数值',
      icon: 'none',
    })
    return
  }

  await userStore.updateProfile({ dailyCalorieGoal: goal })
  showGoalModal.value = false

  uni.showToast({
    title: '保存成功',
    icon: 'success',
  })
}

function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
      }
    },
  })
}
</script>

<template>
  <view class="container">
    <view class="profile-header">
      <view class="avatar-section">
        <image v-if="userStore.profile?.avatar" :src="userStore.profile.avatar" class="avatar" />
        <view v-else class="avatar-placeholder">
          <text class="avatar-icon">👤</text>
        </view>
      </view>

      <view class="user-info" v-if="userStore.isLoggedIn">
        <text class="nickname">{{ userStore.profile?.nickname || '用户' }}</text>
        <text class="uid">ID: {{ userStore.openid.substring(0, 8) }}...</text>
      </view>

      <view class="login-prompt" v-else>
        <button class="login-btn" @tap="handleLogin">微信登录</button>
        <text class="login-hint">登录后同步数据</text>
      </view>
    </view>

    <view class="menu-section" v-if="userStore.isLoggedIn">
      <view class="menu-card">
        <view class="menu-item" @tap="openGoalModal">
          <view class="item-left">
            <text class="item-icon">🎯</text>
            <text class="item-text">每日热量目标</text>
          </view>
          <view class="item-right">
            <text class="item-value">{{ userStore.profile?.dailyCalorieGoal || 2000 }} 千卡</text>
            <text class="item-arrow">›</text>
          </view>
        </view>

        <view class="menu-item">
          <view class="item-left">
            <text class="item-icon">📊</text>
            <text class="item-text">历史记录</text>
          </view>
          <view class="item-right">
            <text class="item-value">查看全部</text>
            <text class="item-arrow">›</text>
          </view>
        </view>

        <view class="menu-item">
          <view class="item-left">
            <text class="item-icon">💡</text>
            <text class="item-text">饮食建议</text>
          </view>
          <view class="item-right">
            <text class="item-arrow">›</text>
          </view>
        </view>
      </view>

      <view class="menu-card">
        <view class="menu-item">
          <view class="item-left">
            <text class="item-icon">⚙️</text>
            <text class="item-text">设置</text>
          </view>
          <view class="item-right">
            <text class="item-arrow">›</text>
          </view>
        </view>

        <view class="menu-item">
          <view class="item-left">
            <text class="item-icon">❓</text>
            <text class="item-text">帮助与反馈</text>
          </view>
          <view class="item-right">
            <text class="item-arrow">›</text>
          </view>
        </view>

        <view class="menu-item">
          <view class="item-left">
            <text class="item-icon">ℹ️</text>
            <text class="item-text">关于我们</text>
          </view>
          <view class="item-right">
            <text class="item-value">v0.1.0</text>
            <text class="item-arrow">›</text>
          </view>
        </view>
      </view>

      <button class="logout-btn" @tap="handleLogout">退出登录</button>
    </view>

    <view class="features-section" v-else>
      <view class="feature-card">
        <text class="feature-icon">📸</text>
        <text class="feature-title">拍照识别</text>
        <text class="feature-desc">一键识别食物热量</text>
      </view>
      <view class="feature-card">
        <text class="feature-icon">📊</text>
        <text class="feature-title">营养统计</text>
        <text class="feature-desc">每日营养摄入分析</text>
      </view>
      <view class="feature-card">
        <text class="feature-icon">🎯</text>
        <text class="feature-title">目标管理</text>
        <text class="feature-desc">设定并追踪目标</text>
      </view>
    </view>

    <view class="modal-mask" v-if="showGoalModal" @tap="showGoalModal = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-title">设置每日热量目标</text>
        </view>
        <view class="modal-body">
          <input
            v-model="newGoal"
            type="number"
            placeholder="请输入目标热量(千卡)"
            class="goal-input"
          />
          <text class="goal-hint">建议成人每日摄入1500-2500千卡</text>
        </view>
        <view class="modal-footer">
          <button class="cancel-btn" @tap="showGoalModal = false">取消</button>
          <button class="confirm-btn" @tap="saveGoal">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.container {
  padding: 20rpx;
  background: linear-gradient(180deg, #4caf50 0%, #f5f5f5 30%);
  min-height: 100vh;
}

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
}

.avatar-section {
  margin-bottom: 20rpx;
}

.avatar {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  border: 6rpx solid #fff;
}

.avatar-placeholder {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 60rpx;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.nickname {
  font-size: 36rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 10rpx;
}

.uid {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.login-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15rpx;
}

.login-btn {
  background: #fff;
  color: #4caf50;
  font-size: 28rpx;
  padding: 15rpx 60rpx;
  border-radius: 40rpx;
  border: none;
}

.login-btn::after {
  border: none;
}

.login-hint {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.menu-card {
  background: #fff;
  border-radius: 15rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.item-icon {
  font-size: 36rpx;
}

.item-text {
  font-size: 28rpx;
  color: #333;
}

.item-right {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.item-value {
  font-size: 26rpx;
  color: #999;
}

.item-arrow {
  font-size: 32rpx;
  color: #ccc;
}

.logout-btn {
  margin-top: 30rpx;
  background: #fff;
  color: #f44336;
  font-size: 28rpx;
  border-radius: 15rpx;
  border: none;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.logout-btn::after {
  border: none;
}

.features-section {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
  margin-top: 20rpx;
}

.feature-card {
  flex: 1;
  min-width: 200rpx;
  background: #fff;
  border-radius: 15rpx;
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

.feature-icon {
  font-size: 50rpx;
}

.feature-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
}

.feature-desc {
  font-size: 22rpx;
  color: #999;
  text-align: center;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  width: 600rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
}

.modal-header {
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.modal-body {
  padding: 30rpx;
}

.goal-input {
  width: 100%;
  height: 80rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 10rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
  margin-bottom: 15rpx;
}

.goal-hint {
  font-size: 22rpx;
  color: #999;
}

.modal-footer {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  background: #fff;
  border: none;
  border-radius: 0;
}

.cancel-btn::after,
.confirm-btn::after {
  border: none;
}

.cancel-btn {
  color: #666;
  border-right: 1rpx solid #f0f0f0;
}

.confirm-btn {
  color: #4caf50;
  font-weight: bold;
}
</style>
