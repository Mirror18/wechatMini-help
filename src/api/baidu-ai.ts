import { config } from '@/config'
import type { BaiduAITokenResponse, BaiduAIDishResponse } from '@/types'

let accessToken = ''
let tokenExpireTime = 0

export async function getAccessToken(): Promise<string> {
  if (accessToken && Date.now() < tokenExpireTime) {
    return accessToken
  }

  const { apiKey, secretKey, tokenUrl } = config.baiduAI
  
  const response = await new Promise<BaiduAITokenResponse>((resolve, reject) => {
    uni.request({
      url: `${tokenUrl}?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`,
      method: 'GET',
      success: (res) => resolve(res.data as BaiduAITokenResponse),
      fail: (err) => reject(err)
    })
  })

  accessToken = response.access_token
  tokenExpireTime = Date.now() + (response.expires_in - 60) * 1000
  
  return accessToken
}

export async function recognizeDish(base64Image: string): Promise<BaiduAIDishResponse> {
  const token = await getAccessToken()
  
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${config.baiduAI.dishUrl}?access_token=${token}`,
      method: 'POST',
      header: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {
        image: base64Image,
        top_num: 5,
        filter_threshold: 0.7
      },
      success: (res) => resolve(res.data as BaiduAIDishResponse),
      fail: (err) => reject(err)
    })
  })
}

export function imageToBase64(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.getFileSystemManager().readFile({
      filePath,
      encoding: 'base64',
      success: (res) => resolve(res.data as string),
      fail: (err) => reject(err)
    })
  })
}
