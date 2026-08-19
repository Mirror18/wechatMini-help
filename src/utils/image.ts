import { isH5 } from './platform'

export interface ChooseImageResult {
  tempFilePaths: string[]
  tempFiles?: UniApp.ChooseImageSuccessCallbackResultFile[]
}

/**
 * 选择图片（相册/相机）
 * H5 环境下优先使用相册，因为部分浏览器不支持直接调用摄像头
 */
export function chooseImage(count: number = 1): Promise<string[]> {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count,
      sizeType: ['compressed'],
      // H5 直接调 camera 在部分桌面浏览器会失败，保持兼容由用户选择
      sourceType: isH5() ? ['album', 'camera'] : ['camera', 'album'],
      success: (res) => resolve(res.tempFilePaths as string[]),
      fail: (err) => reject(err),
    })
  })
}

/**
 * 压缩图片
 * H5 下 uni.compressImage 支持不稳定，使用 canvas 压缩兜底
 */
export function compressImage(src: string, quality: number = 80): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.compressImage({
      src,
      quality,
      success: (res) => resolve(res.tempFilePath),
      fail: (err) => {
        if (isH5()) {
          canvasCompress(src, quality)
            .then(resolve)
            .catch(() => reject(err))
        } else {
          reject(err)
        }
      },
    })
  })
}

/**
 * 获取图片信息
 */
export function getImageInfo(src: string): Promise<UniApp.GetImageInfoSuccessData> {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src,
      success: (res) => resolve(res),
      fail: (err) => reject(err),
    })
  })
}

/**
 * 将本地图片转为 Base64
 * 小程序使用 FileSystemManager；H5 使用 fetch + FileReader
 */
export function imageToBase64(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // 小程序/FileSystemManager 可用时优先使用
    if (typeof uni.getFileSystemManager === 'function') {
      try {
        uni.getFileSystemManager().readFile({
          filePath,
          encoding: 'base64',
          success: (res) => resolve(cleanBase64(res.data as string)),
          fail: (err) => {
            if (isH5()) {
              h5ImageToBase64(filePath).then(resolve).catch(reject)
            } else {
              reject(err)
            }
          },
        })
        return
      } catch {
        // 部分平台 getFileSystemManager 不存在，继续走 H5 兜底
      }
    }

    if (isH5()) {
      h5ImageToBase64(filePath).then(resolve).catch(reject)
    } else {
      reject(new Error('当前平台不支持读取文件为 Base64'))
    }
  })
}

/**
 * H5 读取图片为 Base64
 */
function h5ImageToBase64(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fetch(filePath)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader()
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1] || ''
          resolve(cleanBase64(base64))
        }
        reader.onerror = () => reject(new Error('H5 读取图片失败'))
        reader.readAsDataURL(blob)
      })
      .catch((err) => reject(err))
  })
}

/**
 * 使用 canvas 压缩图片（H5 兜底）
 */
function canvasCompress(src: string, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const maxWidth = 1280
      const scale = Math.min(1, maxWidth / img.width)
      const width = Math.floor(img.width * scale)
      const height = Math.floor(img.height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('无法创建 canvas 上下文'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality / 100).split(',')[1] || '')
    }
    img.onerror = () => reject(new Error('H5 加载图片失败'))
    img.src = src
  })
}

/**
 * 去除 base64 中可能包含的前缀，仅保留数据部分
 */
function cleanBase64(data: string): string {
  if (!data) return ''
  const idx = data.indexOf(',')
  return idx >= 0 ? data.slice(idx + 1) : data
}
