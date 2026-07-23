# H-DRAW App (uni-app 版)

> 基于 uni-app 的 AI 生图 App，同时支持 Android + iOS

## 使用方式

### 1. 安装 HBuilderX

### 2. 导入项目
- 打开 HBuilderX
- 文件 → 导入 → 导入本地项目
- 选择 `h-draw-app` 目录

### 3. 运行/编译

| 目标 | 操作 |
|------|------|
| 浏览器预览 | 运行 → 运行到浏览器 |
| Android App | 运行 → 运行到手机或模拟器 |
| 打包 APK | 发行 → 原生App-云打包 → 打包Android |
| 打包 IPA | 发行 → 原生App-云打包 → 打包iOS |

## 项目结构

```
h-draw-app/
├── pages/
│   ├── index/index.vue         # 生图页
│   ├── history/history.vue     # 历史记录
│   ├── preview/preview.vue     # 图片预览
│   └── settings/settings.vue   # 设置页
├── utils/
│   ├── api.js                  # OpenAI API 服务
│   ├── crypto.js               # 密钥加解密
│   ├── util.js                 # 工具函数
│   └── store.js                # 本地存储
├── static/                     # 图标
├── App.vue                     # 全局样式
├── main.js                     # 入口
├── pages.json                  # 页面路由
├── manifest.json               # App 配置
└── package.json
```
