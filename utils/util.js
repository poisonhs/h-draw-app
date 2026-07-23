/**
 * H-DRAW 通用工具函数（uni-app 版）
 */

export function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000 && date.getDate() === now.getDate()) return `${Math.floor(diff / 3600000)}小时前`
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return '昨天 ' + padZero(date.getHours()) + ':' + padZero(date.getMinutes())
  if (date.getFullYear() === now.getFullYear()) return `${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`
  return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`
}

function padZero(num) {
  return num < 10 ? '0' + num : String(num)
}

export function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    uni.setClipboardData({
      data: text,
      success: () => {
        uni.showToast({ title: '已复制', icon: 'success' })
        resolve(true)
      },
      fail: (err) => {
        uni.showToast({ title: '复制失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

export function downloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    uni.showLoading({ title: '下载中...' })
    uni.downloadFile({
      url: imageUrl,
      timeout: 60000,
      success: (res) => {
        if (res.statusCode === 200) {
          uni.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              uni.hideLoading()
              uni.showToast({ title: '已保存到相册', icon: 'success' })
              resolve(true)
            },
            fail: (err) => {
              uni.hideLoading()
              handleSaveFail(err)
              reject(err)
            }
          })
        } else {
          uni.hideLoading()
          uni.showToast({ title: '下载失败', icon: 'none' })
          reject(new Error('下载失败'))
        }
      },
      fail: (err) => {
        uni.hideLoading()
        uni.showToast({ title: '下载失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

function handleSaveFail(err) {
  if (err.errMsg && err.errMsg.includes('auth deny')) {
    uni.showModal({
      title: '需要权限',
      content: '需要相册写入权限才能保存图片，是否前往设置？',
      success: (res) => { if (res.confirm) uni.openSetting() }
    })
  } else {
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}
