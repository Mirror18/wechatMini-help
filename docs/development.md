# 开发指南

## 环境搭建

### 1. 安装Node.js

推荐使用 nvm 管理Node版本：

```bash
# 安装nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装Node.js 20
nvm install 20
nvm use 20
```

### 2. 安装微信开发者工具

下载地址: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

### 3. 申请百度AI账号

1. 访问 https://ai.baidu.com/
2. 注册并登录
3. 进入控制台 → 图像识别 → 菜品识别
4. 创建应用，获取 API Key 和 Secret Key

## 项目初始化

```bash
# 创建项目（使用TypeScript模板）
npx degit dcloudio/uni-preset-vue#vite-ts .
npm install

# 安装额外依赖
npm install pinia @dcloudio/uni-ui
npm install -D @types/node
```

## 开发流程

### 1. 配置百度AI

创建 `src/config/index.ts`:

```typescript
export const config = {
  baiduAI: {
    apiKey: 'YOUR_API_KEY',
    secretKey: 'YOUR_SECRET_KEY'
  }
}
```

### 2. 启动开发服务器

```bash
npm run dev:mp-weixin
```

编译完成后，在微信开发者工具中导入 `dist/dev/mp-weixin` 目录。

### 3. 云函数开发

```bash
# 进入云函数目录
cd uniCloud-aliyun/cloudfunctions

# 创建云函数
# 使用HBuilderX右键创建，或手动创建
```

## 编码规范

### 文件命名

- 页面文件夹: `kebab-case` (如 `food-result`)
- 组件文件: `PascalCase` (如 `FoodCard.vue`)
- 工具文件: `camelCase` (如 `imageUtils.ts`)
- 类型文件: `camelCase` (如 `food.ts`)

### Vue组件规范

```vue
<script setup lang="ts">
// 1. 导入
import { ref, computed } from 'vue'
import { useFoodStore } from '@/stores/food'

// 2. Store
const foodStore = useFoodStore()

// 3. Props
const props = defineProps<{
  foodName: string
  calories: number
}>()

// 4. 响应式数据
const loading = ref(false)

// 5. 计算属性
const formattedCalories = computed(() => 
  `${props.calories} kcal`
)

// 6. 方法
const handleSave = async () => {
  loading.value = true
  try {
    await foodStore.addRecord({...})
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- 模板 -->
</template>

<style scoped>
/* 样式 */
</style>
```

### TypeScript规范

```typescript
// 使用接口定义数据结构
interface FoodRecord {
  _id: string
  foodName: string
  calories: number
}

// 使用枚举定义常量
enum MealType {
  Breakfast = 'breakfast',
  Lunch = 'lunch',
  Dinner = 'dinner',
  Snack = 'snack'
}

// 函数参数和返回值类型
function calculateTotal(records: FoodRecord[]): number {
  return records.reduce((sum, r) => sum + r.calories, 0)
}
```

## 调试技巧

### 前端调试

1. 微信开发者工具 → 调试器 → Console
2. 使用 `console.log` 输出调试信息
3. 使用 Network 面板查看API请求

### 云函数调试

1. HBuilderX → 云函数目录 → 右键 → 本地运行
2. 查看云函数控制台日志
3. 使用 `console.log` 输出到云函数日志

### 常见问题

#### 图片上传失败
```typescript
// 检查图片大小
const file = uni.getFileSystemManager().readFileSync(path)
if (file.byteLength > 1024 * 1024) {
  // 需要压缩
}
```

#### 识别结果不准确
- 确保图片清晰
- 调整 `filter_threshold` 过滤低置信度结果
- 使用 `top_num` 返回更多结果

## 测试

### 单元测试

```bash
# 运行测试
npm run test

# 测试覆盖率
npm run test:coverage
```

### 真机测试

1. 微信开发者工具 → 预览
2. 扫码在真机上测试
3. 测试拍照、识别、保存等核心流程

## 构建发布

### 1. 生产构建

```bash
npm run build:mp-weixin
```

### 2. 上传代码

1. 微信开发者工具 → 上传
2. 填写版本号和描述
3. 上传到微信审核

### 3. 发布流程

```
开发 → 测试 → 上传 → 审核 → 发布
```

## 协作规范

### Git提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式
refactor: 重构
test: 测试相关
chore: 构建/工具
```

### 分支管理

```
main          # 生产分支
├── develop   # 开发分支
│   ├── feature/xxx  # 功能分支
│   └── fix/xxx      # 修复分支
└── release/x.x.x    # 发布分支
```

## 参考资源

- [UniApp官方文档](https://uniapp.dcloud.net.cn/)
- [Vue3文档](https://vuejs.org/)
- [百度AI文档](https://ai.baidu.com/ai-doc)
- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
