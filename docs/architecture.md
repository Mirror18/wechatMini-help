# 架构说明

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    微信小程序前端                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Pages  │  │Components│  │ Stores  │  │   API   │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │               │
│       └────────────┴────────────┴────────────┘               │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │    uniCloud     │
                    │  (云函数+数据库)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
      ┌───────▼───────┐ ┌───▼───┐ ┌────────▼────────┐
      │  百度AI API   │ │ 数据库 │ │  微信开放能力    │
      │ (菜品识别)    │ │       │ │ (登录/支付)     │
      └───────────────┘ └───────┘ └─────────────────┘
```

## 前端架构

### 页面层 (Pages)

| 页面 | 路径 | 功能 |
|------|------|------|
| 首页 | `/pages/index/index` | 拍照入口，今日热量概览 |
| 结果页 | `/pages/result/result` | 识别结果，营养成分展示 |
| 历史页 | `/pages/history/history` | 饮食记录列表 |
| 统计页 | `/pages/stats/stats` | 图表分析 |
| 个人中心 | `/pages/profile/profile` | 用户信息，设置 |

### 组件层 (Components)

```
components/
├── CameraCapture.vue    # 相机拍照组件
├── FoodCard.vue         # 食物信息卡片
├── CalorieChart.vue     # 热量图表（基于echarts）
├── NavBar.vue           # 自定义导航栏
├── MealSelector.vue     # 餐次选择器
└── DatePicker.vue       # 日期选择器
```

### 状态管理 (Pinia Stores)

```typescript
// stores/user.ts
export const useUserStore = defineStore('user', {
  state: () => ({
    openid: '',
    profile: null as UserProfile | null,
    isLoggedIn: false
  }),
  actions: {
    login(): Promise<void>,
    fetchProfile(): Promise<void>,
    updateProfile(data: UserProfile): Promise<void>
  }
})

// stores/food.ts
export const useFoodStore = defineStore('food', {
  state: () => ({
    records: [] as FoodRecord[],
    todayCalories: 0,
    loading: false
  }),
  actions: {
    addRecord(record: FoodRecord): Promise<void>,
    fetchRecords(date: string): Promise<void>,
    deleteRecord(id: string): Promise<void>,
    fetchStats(startDate: string, endDate: string): Promise<StatsData>
  }
})
```

### API层

```
api/
├── baidu-ai.ts      # 百度AI菜品识别封装
├── cloud.ts         # uniCloud云函数调用封装
└── food-db.ts       # 食物数据库操作
```

## 后端架构 (uniCloud)

### 云函数

```
uniCloud-aliyun/cloudfunctions/
├── user/
│   ├── login/index.ts       # 用户登录
│   └── profile/index.ts     # 用户信息管理
├── food/
│   ├── record/index.ts      # 食物记录CRUD
│   └── stats/index.ts       # 统计分析
└── common/
    └── utils.ts             # 公共工具函数
```

### 数据库集合

```
├── users              # 用户表
│   ├── _id
│   ├── openid
│   ├── nickname
│   ├── avatar
│   └── dailyCalorieGoal

├── food_records       # 食物记录表
│   ├── _id
│   ├── userId
│   ├── foodName
│   ├── calories
│   ├── protein
│   ├── fat
│   ├── carbs
│   ├── imageUrl
│   ├── mealType
│   ├── date
│   └── createdAt

└── food_database      # 食物热量参考表
    ├── _id
    ├── name
    ├── calories
    ├── protein
    ├── fat
    └── carbs
```

## 数据流

```
拍照 → 图片压缩 → Base64编码 → 百度AI识别
                                    ↓
                            获取食物名称和置信度
                                    ↓
                            查询食物热量数据库
                                    ↓
                        展示识别结果（结果页）
                                    ↓
                            用户确认并保存
                                    ↓
                        云函数写入 food_records
```

## 关键技术点

### 图片处理流程

```typescript
// 1. 选择图片
const tempPath = await uni.chooseImage({ count: 1 })

// 2. 压缩图片
const compressed = await uni.compressImage({
  src: tempPath,
  quality: 80
})

// 3. 转Base64
const base64 = uni.arrayBufferToBase64(
  uni.readFileSync(compressed)
)

// 4. 调用识别API
const result = await baiduAIService.dishRecognize(base64)
```

### 错误处理策略

- 网络错误：自动重试3次，显示离线提示
- 识别失败：显示默认食物选择列表
- 数据库错误：本地缓存兜底，后台同步

### 性能优化

- 图片压缩后再上传（目标<1MB）
- 食物热量数据本地缓存
- 历史记录分页加载
- 图表数据懒加载
