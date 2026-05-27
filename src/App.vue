<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  // eslint-disable-next-line no-console
  console.log('App Launch')

  // 全局错误处理
  uni.onError((err) => {
    // eslint-disable-next-line no-console
    console.error('Global error:', err)
  })
})

onShow(() => {
  // eslint-disable-next-line no-console
  console.log('App Show')
})

onHide(() => {
  // eslint-disable-next-line no-console
  console.log('App Hide')
})
</script>

<style></style>
