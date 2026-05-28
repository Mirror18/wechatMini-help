import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile } from '@/types'

export const useUserStore = defineStore('user', () => {
  const STORAGE_KEY = 'user_openid'
  const openid = ref(uni.getStorageSync(STORAGE_KEY) || '')
  const profile = ref<UserProfile | null>(null)
  const isLoggedIn = computed(() => !!openid.value)
  const loading = ref(false)

  function persistOpenid(val: string) {
    openid.value = val
    if (val) {
      uni.setStorageSync(STORAGE_KEY, val)
    } else {
      uni.removeStorageSync(STORAGE_KEY)
    }
  }

  async function login() {
    try {
      loading.value = true
      const { code } = await uni.login({ provider: 'weixin' })

      const { result } = await uniCloud.callFunction({
        name: 'user-login',
        data: { code },
      })

      persistOpenid(result.data.openid)
      await fetchProfile()
    } catch (error) {
      console.error('登录失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    if (!openid.value) return

    try {
      const { result } = await uniCloud.callFunction({
        name: 'user-profile',
        data: {
          action: 'get',
        },
      })

      profile.value = result
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // token 失效时清掉本地存储
      if ((error as any)?.message?.includes('401')) {
        persistOpenid('')
        profile.value = null
      }
    }
  }

  async function updateProfile(data: Partial<UserProfile>) {
    if (!openid.value) return

    try {
      loading.value = true
      await uniCloud.callFunction({
        name: 'user-profile',
        data: {
          action: 'update',
          ...data,
        },
      })

      await fetchProfile()
    } catch (error) {
      console.error('更新用户信息失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  function logout() {
    persistOpenid('')
    profile.value = null
  }

  // 启动时若已有 openid，自动拉取资料
  if (openid.value) {
    fetchProfile()
  }

  return {
    openid,
    profile,
    isLoggedIn,
    loading,
    login,
    fetchProfile,
    updateProfile,
    logout,
  }
})
