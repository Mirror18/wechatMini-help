import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { isH5 } from '@/utils/platform'
import type { UserProfile } from '@/types'

const STORAGE_KEY = 'user_openid'
const H5_ANON_KEY = 'h5_anonymous_openid'

/**
 * H5 无法调用微信登录，生成一个本地匿名 openid 用于开发调试。
 * 生产环境 H5 建议接入微信网页授权或短信登录。
 */
function getH5AnonymousOpenid(): string {
  let id = uni.getStorageSync(H5_ANON_KEY)
  if (!id) {
    id = 'h5_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
    uni.setStorageSync(H5_ANON_KEY, id)
  }
  return id
}

export const useUserStore = defineStore('user', () => {
  // H5 未登录时使用匿名 id，保证云端接口可调用
  const initialOpenid = isH5()
    ? uni.getStorageSync(STORAGE_KEY) || getH5AnonymousOpenid()
    : uni.getStorageSync(STORAGE_KEY) || ''

  const openid = ref(initialOpenid)
  const profile = ref<UserProfile | null>(null)
  const isLoggedIn = computed(() => !!openid.value && !openid.value.startsWith('h5_'))
  const isAnonymous = computed(() => openid.value.startsWith('h5_'))
  const loading = ref(false)

  function persistOpenid(val: string) {
    openid.value = val
    if (val) {
      uni.setStorageSync(STORAGE_KEY, val)
    } else {
      uni.removeStorageSync(STORAGE_KEY)
      uni.removeStorageSync(H5_ANON_KEY)
    }
  }

  async function login() {
    try {
      loading.value = true

      // H5 环境走匿名登录兜底，避免 uni.login 直接报错
      if (isH5()) {
        const anonId = getH5AnonymousOpenid()
        persistOpenid(anonId)
        await fetchProfile()
        return
      }

      const { code } = await uni.login({ provider: 'weixin' })

      const { result } = await uniCloud.callFunction({
        name: 'user-login',
        data: { code },
      })

      if (result.code !== 0 || !result.data?.openid) {
        throw new Error(result.message || '登录失败')
      }

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

      if (result.code === -1 && result.message?.includes('用户不存在')) {
        // H5 匿名用户在云端不存在时自动创建
        if (isH5()) {
          await createAnonymousProfile()
          return
        }
        throw new Error(result.message)
      }

      if (result.code !== 0) {
        throw new Error(result.message || '获取用户信息失败')
      }

      profile.value = result.data
    } catch (error) {
      console.error('获取用户信息失败:', error)
      if ((error as any)?.message?.includes('401')) {
        persistOpenid('')
        profile.value = null
      }
    }
  }

  async function createAnonymousProfile() {
    try {
      const { result } = await uniCloud.callFunction({
        name: 'user-profile',
        data: {
          action: 'update',
          nickname: 'H5游客',
          dailyCalorieGoal: 2000,
        },
      })

      if (result.code !== 0) {
        throw new Error(result.message || '创建用户信息失败')
      }

      await fetchProfile()
    } catch (error) {
      console.error('创建匿名用户失败:', error)
    }
  }

  async function updateProfile(data: Partial<UserProfile>) {
    if (!openid.value) return

    try {
      loading.value = true
      const { result } = await uniCloud.callFunction({
        name: 'user-profile',
        data: {
          action: 'update',
          ...data,
        },
      })

      if (result.code !== 0) {
        throw new Error(result.message || '更新用户信息失败')
      }

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
    isAnonymous,
    loading,
    login,
    fetchProfile,
    updateProfile,
    logout,
  }
})
