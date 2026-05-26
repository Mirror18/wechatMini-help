import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserProfile } from '@/types'

export const useUserStore = defineStore('user', () => {
  const openid = ref('')
  const profile = ref<UserProfile | null>(null)
  const isLoggedIn = computed(() => !!openid.value)
  const loading = ref(false)

  async function login() {
    try {
      loading.value = true
      const { code } = await uni.login({ provider: 'weixin' })
      
      const { result } = await uniCloud.callFunction({
        name: 'user-login',
        data: { code }
      })
      
      openid.value = result.openid
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
          openid: openid.value 
        }
      })
      
      profile.value = result
    } catch (error) {
      console.error('获取用户信息失败:', error)
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
          openid: openid.value,
          ...data
        }
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
    openid.value = ''
    profile.value = null
  }

  return {
    openid,
    profile,
    isLoggedIn,
    loading,
    login,
    fetchProfile,
    updateProfile,
    logout
  }
})
