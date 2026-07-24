# H-DRAW App (uni-app 鐗?

> 鍩轰簬 uni-app 鐨?AI 鐢熷浘 App锛屽悓鏃舵敮鎸?Android + iOS + 灏忕▼搴?
## 浣跨敤鏂瑰紡

### 1. 瀹夎 HBuilderX
涓嬭浇 [HBuilderX](https://www.dcloud.io/hbuilderx.html) 骞跺畨瑁?
### 2. 瀵煎叆椤圭洰
- 鎵撳紑 HBuilderX
- 鏂囦欢 鈫?瀵煎叆 鈫?瀵煎叆鏈湴椤圭洰
- 閫夋嫨 `h-draw-app` 鐩綍

### 3. 杩愯/缂栬瘧

| 鐩爣 | 鎿嶄綔 |
|------|------|
| 娴忚鍣ㄩ瑙?| 杩愯 鈫?杩愯鍒版祻瑙堝櫒 |
| Android App | 杩愯 鈫?杩愯鍒版墜鏈烘垨妯℃嫙鍣?|
| 鎵撳寘 APK | 鍙戣 鈫?鍘熺敓App-浜戞墦鍖?鈫?鎵撳寘Android |
| 鎵撳寘 IPA | 鍙戣 鈫?鍘熺敓App-浜戞墦鍖?鈫?鎵撳寘iOS |
| 寰俊灏忕▼搴?| 鍙戣 鈫?灏忕▼搴?寰俊 |

## 椤圭洰缁撴瀯

```
h-draw-app/
鈹溾攢鈹€ pages/
鈹?  鈹溾攢鈹€ index/index.vue         # 鐢熷浘椤?鈹?  鈹溾攢鈹€ history/history.vue     # 鍘嗗彶璁板綍
鈹?  鈹溾攢鈹€ preview/preview.vue     # 鍥剧墖棰勮
鈹?  鈹斺攢鈹€ settings/settings.vue   # 璁剧疆椤?鈹溾攢鈹€ utils/
鈹?  鈹溾攢鈹€ api.js                  # OpenAI API 鏈嶅姟
鈹?  鈹溾攢鈹€ crypto.js               # 瀵嗛挜鍔犺В瀵?鈹?  鈹溾攢鈹€ util.js                 # 宸ュ叿鍑芥暟
鈹?  鈹斺攢鈹€ store.js                # 鏈湴瀛樺偍
鈹溾攢鈹€ static/                     # 鍥炬爣
鈹溾攢鈹€ App.vue                     # 鍏ㄥ眬鏍峰紡
鈹溾攢鈹€ main.js                     # 鍏ュ彛
鈹溾攢鈹€ pages.json                  # 椤甸潰璺敱
鈹溾攢鈹€ manifest.json               # App 閰嶇疆
鈹斺攢鈹€ package.json
```

## GitHub Actions 导出未签名 IPA（TrollStore）

工作流：.github/workflows/build-ios.yml（仅手动触发）。

流程：HBuilderX 导出 unpackage/dist/build/app-plus → 注入 DCloud iOS 离线 SDK（HBuilder-Hello）→ macOS 上 xcodebuild 不签名 → H-DRAW-unsigned.ipa。

### 一次性准备

1. 从 DCloud 下载与 **HBuilderX 5.15** 匹配的 iOS 离线 SDK，命名为 dcloud-ios-sdk-5.15.zip
2. 在仓库 Releases 新建 tag ios-sdk-5.15，上传该 ZIP
3. （可选）在 Actions Variables 设置 IOS_SHELL_URL 指向 SDK 直链

### 每次发 IPA

1. HBuilderX：发行 → 原生 App-本地打包 → 生成 app 资源（确保 unpackage/dist/build/app-plus 已更新并提交）
2. Actions → **Build unsigned iOS IPA** → Run workflow
3. 从 Artifacts 下载 H-DRAW-unsigned-ipa，或从 Release ios-sdk-5.15 取 H-DRAW-unsigned.ipa
4. 用 **TrollStore** 等支持未签名包的方式安装（非 App Store）

不要上传 Apple 证书/私钥或 unpackage/cache。SDK 版本须与 app-plus 资源版本一致。

Android 发版仍走 tag * → elease.yml（ersion.json + 可选 APK）。