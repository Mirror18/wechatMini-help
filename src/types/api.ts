export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface BaiduAITokenResponse {
  access_token: string
  expires_in: number
}

export interface BaiduAIDishResponse {
  log_id: number
  result_num: number
  result: BaiduAIDishResult[]
}

export interface BaiduAIDishResult {
  name: string
  calorie: string
  probability: string
  has_calorie: boolean
}

export interface CloudFunctionResponse<T = any> {
  event: string
  requestId: string
  result: T
}
