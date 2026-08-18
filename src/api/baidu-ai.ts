import { config } from '@/config'
import { isH5 } from '@/utils/platform'
import type { BaiduAITokenResponse, BaiduAIDishResponse } from '@/types'

let accessToken = ''
let tokenExpireTime = 0

/**
 * 小程序端直接获取百度 AI access_token
 */
export async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpireTime) {
    return accessToken
  }

  const { apiKey, secretKey, tokenUrl } = config.baiduAI

  if (!apiKey || !secretKey) {
    throw new Error('请在 .env.local 中配置百度 AI API Key 和 Secret Key')
  }

  const response = await new Promise<BaiduAITokenResponse>((resolve, reject) => {
    uni.request({
      url: `${tokenUrl}?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`,
      method: 'GET',
      success: (res) => resolve(res.data as BaiduAITokenResponse),
      fail: (err) => reject(err),
    })
  })

  if (!response.access_token) {
    throw new Error('获取百度 access_token 失败: ' + JSON.stringify(response))
  }

  accessToken = response.access_token
  tokenExpireTime = Date.now() + (response.expires_in - 60) * 1000

  return accessToken
}

/**
 * 小程序端直接调用百度菜品识别
 */
async function recognizeDishDirect(base64Image: string): Promise<BaiduAIDishResponse> {
  const token = await getAccessToken()

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${config.baiduAI.dishUrl}?access_token=${token}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: {
        image: base64Image,
        top_num: 5,
        filter_threshold: 0.7,
      },
      success: (res) => resolve(res.data as BaiduAIDishResponse),
      fail: (err) => reject(err),
    })
  })
}

/**
 * H5 端通过云函数代理调用百度菜品识别
 * 避免浏览器 CORS 限制并在服务端保管密钥
 */
async function recognizeDishByCloud(base64Image: string): Promise<BaiduAIDishResponse> {
  const { result } = await uniCloud.callFunction({
    name: 'baidu-dish',
    data: {
      image: base64Image,
      topNum: 5,
      filterThreshold: 0.7,
    },
  })

  if (result.code !== 0) {
    throw new Error(result.message || '识别失败')
  }

  return result.data as BaiduAIDishResponse
}

/**
 * 菜品识别入口
 * H5 走云函数代理，小程序直接请求百度接口
 */
export async function recognizeDish(base64Image: string): Promise<BaiduAIDishResponse> {
  if (isH5() || config.baiduAI.useCloudProxy) {
    return recognizeDishByCloud(base64Image)
  }
  return recognizeDishDirect(base64Image)
}

/**
 * 将本地图片转为 Base64
 */
export { imageToBase64 } from '@/utils/image'
