# API接口文档

## 百度AI菜品识别API

### 接口信息

- **接口地址**: `https://aip.baidubce.com/rest/2.0/image-classify/v1/dish`
- **请求方式**: POST
- **Content-Type**: application/x-www-form-urlencoded

### 认证方式

使用 Access Token 认证，需要先获取 access_token：

```
GET https://aip.baidubce.com/oauth/2.0/token
  ?grant_type=client_credentials
  &client_id={API_KEY}
  &client_secret={SECRET_KEY}
```

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| image | string | 是 | 图片Base64编码 |
| top_num | int | 否 | 返回结果数量，默认5 |
| filter_threshold | float | 否 | 置信度过滤阈值 |

### 响应示例

```json
{
  "log_id": 1234567890,
  "result_num": 3,
  "result": [
    {
      "name": "宫保鸡丁",
      "calorie": "162.55",
      "probability": "0.95",
      "has_calorie": true
    }
  ]
}
```

### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 菜品名称 |
| calorie | string | 热量（千卡/100g） |
| probability | string | 识别置信度 |
| has_calorie | boolean | 是否有热量数据 |

## 云函数接口

### 用户相关

#### wx.login
- **功能**: 微信登录
- **参数**: 无
- **返回**: `{ openid, session_key }`

#### user.getProfile
- **功能**: 获取用户信息
- **参数**: `{ openid: string }`
- **返回**: `UserProfile`

#### user.updateProfile
- **功能**: 更新用户信息
- **参数**: `UserProfile`
- **返回**: `{ success: boolean }`

### 食物记录相关

#### food.addRecord
- **功能**: 添加食物记录
- **参数**: `FoodRecord`
- **返回**: `{ _id: string }`

#### food.getRecords
- **功能**: 获取食物记录列表
- **参数**: `{ userId: string, date: string }`
- **返回**: `FoodRecord[]`

#### food.deleteRecord
- **功能**: 删除食物记录
- **参数**: `{ _id: string }`
- **返回**: `{ success: boolean }`

#### food.getStats
- **功能**: 获取热量统计
- **参数**: `{ userId: string, startDate: string, endDate: string }`
- **返回**: `StatsData`

## 数据类型定义

```typescript
interface FoodRecord {
  _id: string;
  userId: string;
  foodName: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  imageUrl: string;
  confidence: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date: string;
  createdAt: Date;
}

interface UserProfile {
  _id: string;
  openid: string;
  nickname: string;
  avatar: string;
  dailyCalorieGoal: number;
  createdAt: Date;
}

interface StatsData {
  totalCalories: number;
  avgCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  dailyBreakdown: {
    date: string;
    calories: number;
  }[];
}
```
