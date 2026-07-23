/**
 * H-DRAW 版本更新检查
 *
 * 在服务器放置 version.json，格式：
 * {
 *   "versionCode": 106,
 *   "versionName": "1.0.6",
 *   "url": "https://app.hdraw.de/h-draw-app.apk",
 *   "note": "修复已知问题，优化体验"
 * }
 */

const CHECK_URL = 'https://app.hdraw.de/version.json'

export function checkUpdate() {
  try {
    uni.request({
      url: CHECK_URL,
      method: 'GET',
      timeout: 10000,
      success(res) {
        if (res.statusCode !== 200 || !res.data || !res.data.versionCode) return

        const remote = res.data
        const currentCode = Number(uni.getSystemInfoSync().appVersionCode) || 0

        // 如果没有获取到原生版本号，尝试从 manifest 读取：使用默认值
        // 实际 versionCode 在 manifest.json 中定义，可通过 plus.runtime.version 获取
        let localCode = 0
        try {
          // @ts-ignore
          if (typeof plus !== 'undefined' && plus.runtime) {
            localCode = Number(plus.runtime.versionCode) || 0
          }
        } catch (_) {}

        // 兜底：从 versionName 推断
        if (!localCode) {
          try {
            const v = uni.getSystemInfoSync().appVersion || '1.0.0'
            localCode = Number(v.replace(/\./g, '')) || 100
          } catch (_) {
            localCode = 105 // 当前版本
          }
        }

        if (remote.versionCode > localCode) {
          uni.showModal({
            title: '发现新版本 ' + (remote.versionName || ''),
            content: (remote.note || '有新版本可用，是否更新？') + '\n\n当前版本：' + localCode + '\n最新版本：' + remote.versionCode,
            confirmText: '立即更新',
            cancelText: '稍后再说',
            success: (r) => {
              if (r.confirm && remote.url) {
                uni.setClipboardData({ data: remote.url })
                uni.showToast({ title: '下载链接已复制', icon: 'success' })
                // 尝试直接打开（如果是 APK 链接则复制）
                try {
                  plus.runtime.openURL(remote.url)
                } catch (_) {}
              }
            }
          })
        }
      },
      fail() {
        // 静默失败，不打扰用户
      }
    })
  } catch (_) {}
}
