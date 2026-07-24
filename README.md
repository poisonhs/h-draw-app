# H-DRAW App（uni-app 版）

> 基于 uni-app 的 AI 生图 App，支持 Android + iOS + 微信小程序。

## 使用方式

### 1. 安装 HBuilderX

下载 [HBuilderX](https://www.dcloud.io/hbuilderx.html) 并安装。

### 2. 导入项目

- 打开 HBuilderX
- 文件 → 导入 → 导入本地项目
- 选择 `h-draw-app` 目录

### 3. 运行 / 编译

| 目标 | 操作 |
|------|------|
| 浏览器预览 | 运行 → 运行到浏览器 |
| Android App | 运行 → 运行到手机或模拟器 |
| 打包 APK | 发行 → 原生 App-云打包 → 打包 Android |
| 打包 IPA（云打包） | 发行 → 原生 App-云打包 → 打包 iOS |
| 微信小程序 | 发行 → 小程序-微信 |

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
│   ├── store.js                # 本地存储
│   └── checkUpdate.js          # 版本更新检查
├── scripts/                    # iOS 离线壳打包脚本
├── static/                     # 图标
├── unpackage/dist/build/app-plus/  # HBuilderX 导出的 app 资源（CI 用）
├── App.vue
├── main.js
├── pages.json
├── manifest.json
└── version.json                # 远程更新信息（Android）
```

## GitHub Actions：导出未签名 IPA（TrollStore）

工作流：`.github/workflows/build-ios.yml`（仅手动触发 `workflow_dispatch`）。

流程：

1. 使用仓库内 `unpackage/dist/build/app-plus` 资源  
2. 下载 DCloud iOS 离线 SDK（`HBuilder-Hello`）  
3. 注入业务资源 → macOS `xcodebuild` **不签名**  
4. 产出 `H-DRAW-unsigned.ipa`

### 一次性准备

1. 从 DCloud 下载与 **HBuilderX 5.15** 匹配的 iOS 离线 SDK，命名为 `dcloud-ios-sdk-5.15.zip`
2. 在仓库 Releases 使用 tag `ios-sdk-5.15`，上传该 ZIP  
3. （可选）在 Actions Variables 设置 `IOS_SHELL_URL` 指向 SDK 直链

当前 Release 示例：

- SDK：`dcloud-ios-sdk-5.15.zip`
- IPA：`H-DRAW-unsigned.ipa`  
  https://github.com/poisonhs/h-draw-app/releases/download/ios-sdk-5.15/H-DRAW-unsigned.ipa

### 每次发 IPA

1. HBuilderX：发行 → 原生 App-本地打包 → 生成 app 资源  
   （更新并提交 `unpackage/dist/build/app-plus`）
2. Actions → **Build unsigned iOS IPA** → Run workflow
3. 从 Artifacts 下载 `H-DRAW-unsigned-ipa`，或从 Release `ios-sdk-5.15` 取 `H-DRAW-unsigned.ipa`
4. 用 **TrollStore** 等支持未签名包的方式安装（**不能**按 App Store / 常规描述文件安装）

注意：

- 不要上传 Apple 证书、私钥或 `unpackage/cache`
- 离线 SDK 版本须与 HBuilderX / `app-plus` 资源版本一致

## Android 发版

打 tag `v*`（例如 `v1.0.9`）触发 `.github/workflows/release.yml`：

- 更新 `version.json`（客户端更新检查：`https://app.hdraw.de/version.json`）
- 创建 GitHub Release（可附带 `h-draw-app.apk`）

APK 需用 HBuilderX 打出后手动放到 Release 或仓库约定路径。
