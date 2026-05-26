export const config = {
  baiduAI: {
    apiKey: import.meta.env.VITE_BAIDU_AI_API_KEY || '',
    secretKey: import.meta.env.VITE_BAIDU_AI_SECRET_KEY || '',
    tokenUrl: 'https://aip.baidubce.com/oauth/2.0/token',
    dishUrl: 'https://aip.baidubce.com/rest/2.0/image-classify/v1/dish'
  },
  app: {
    name: '食物热量识别',
    version: '0.1.0'
  }
}
