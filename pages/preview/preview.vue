<template>
  <view class="preview-page">
    
    <!-- 顶栏 -->
    <view class="preview-header">
      <view class="header-btn" @click="goBack">
        <text class="header-btn-icon">←</text>
        <text class="header-btn-text">返回</text>
      </view>
      <view class="header-title">
        <text class="header-date">{{timeText}}</text>
        <text class="header-ratio">{{aspectRatio}}</text>
      </view>
      <view class="header-btn header-delete" @click="deleteRecord">
        <text class="header-btn-icon">🗑️</text>
      </view>
    </view>

    <!-- 图片 -->
    <view class="image-area" @click="toggleInfo">
      <image class="full-image" :src="imageUrl" mode="aspectFit" />
      <view class="tap-hint" v-if="!showInfo">
        <text>点击显示详情</text>
      </view>
    </view>

    <!-- 信息面板 -->
    <view class="info-panel" :class="{'visible': showInfo}">
      <view class="info-card">
        <text class="info-label">📝 提示词</text>
        <text class="info-content selectable">{{promptText}}</text>
      </view>
      <view class="info-card" v-if="showRevised">
        <text class="info-label">🔄 AI 优化提示词</text>
        <text class="info-content selectable">{{revisedPrompt}}</text>
      </view>
      <view class="info-meta">
        <view class="meta-row">
          <text class="meta-label">画面比例</text>
          <text class="meta-value">{{aspectRatio}}</text>
        </view>
        <view class="meta-row">
          <text class="meta-label">生成时间</text>
          <text class="meta-value">{{timeText}}</text>
        </view>
      </view>
    </view>

    <!-- 底部操作 -->
    <view class="preview-footer">
      <view class="footer-btn" @click="copyPrompt">
        <text class="footer-icon">📋</text>
        <text class="footer-text">复制提示词</text>
      </view>
      <view class="footer-btn" @click="downloadImage">
        <text class="footer-icon">💾</text>
        <text class="footer-text">下载图片</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getHistory, deleteHistoryRecord } from '../../utils/store'
import { copyToClipboard, formatTime } from '../../utils/util'

export default {
  data() {
    return {
      imageUrl: '',
      promptText: '',
      revisedPrompt: '',
      aspectRatio: '1:1',
      timeText: '--',
      recordId: '--',
      showRevised: false,
      showInfo: true,
      deleteDialogVisible: false
    }
  },
  onLoad(options) {
    if (options.id) this.loadRecord(options.id)
  },
  methods: {
    loadRecord(id) {
      const history = getHistory()
      const record = history.find(item => item.id === id)
      if (record) {
        this.imageUrl = record.imageUrl || ''
        this.promptText = record.prompt || '无记录'
        this.revisedPrompt = record.revisedPrompt || ''
        this.aspectRatio = record.aspectRatio || '1:1'
        this.timeText = formatTime(record.createTime)
        this.recordId = record.id || '--'
        this.showRevised = !!(record.revisedPrompt && record.revisedPrompt !== record.prompt)
      }
    },
    toggleInfo() { this.showInfo = !this.showInfo },
    goBack() { uni.navigateBack() },
    async copyPrompt() {
      if (this.promptText) await copyToClipboard(this.promptText)
    },
    async downloadImage() {
      if (!this.imageUrl) return
      uni.showLoading({ title: '下载中...' })
      try {
        const res = await new Promise((resolve, reject) => {
          uni.downloadFile({ url: this.imageUrl, timeout: 60000, success: resolve, fail: reject })
        })
        if (res.statusCode !== 200) throw new Error()
        await new Promise((resolve, reject) => {
          uni.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => { uni.hideLoading(); uni.showToast({ title: '已保存到相册', icon: 'success' }); resolve() },
            fail: (err) => {
              uni.hideLoading()
              if (err.errMsg && err.errMsg.includes('auth deny')) {
                uni.showModal({ title: '需要权限', content: '请在手机设置中开启相册权限' })
              } else { uni.showToast({ title: '保存失败', icon: 'none' }) }
              reject(err)
            }
          })
        })
      } catch (e) { uni.hideLoading() }
    },
    deleteRecord() {
      if (!this.recordId) return
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这张图片记录吗？',
        confirmColor: '#ff4757',
        success: (res) => {
          if (res.confirm) {
            deleteHistoryRecord(this.recordId)
            uni.showToast({ title: '已删除', icon: 'success' })
            setTimeout(() => uni.navigateBack(), 1000)
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.preview-page { position: relative; width: 100vw; height: 100vh; background: #fff; display: flex; flex-direction: column; overflow: hidden; }

.preview-header { position: absolute; top: 0; left: 0; right: 0; display: flex; align-items: center; justify-content: space-between; padding: 20rpx 24rpx; z-index: 10; background: linear-gradient(to bottom, rgba(255,255,255,0.92), transparent); }
.header-btn { display: flex; align-items: center; gap: 8rpx; padding: 12rpx 20rpx; background: rgba(0,0,0,0.05); border-radius: 32rpx; }
.header-btn:active { background: rgba(0,0,0,0.1); }
.header-btn-icon { font-size: 28rpx; }
.header-btn-text { font-size: 24rpx; color: #333; }
.header-title { display: flex; flex-direction: column; align-items: center; }
.header-date { font-size: 22rpx; color: #999; }
.header-ratio { font-size: 18rpx; color: #6c63ff; background: rgba(108,99,255,0.1); padding: 2rpx 12rpx; border-radius: 8rpx; }
.header-delete { background: rgba(255,71,87,0.1); }

.image-area { flex: 1; position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.full-image { width: 100%; height: 100%; }
.tap-hint { position: absolute; bottom: 40rpx; left: 50%; transform: translateX(-50%); padding: 12rpx 28rpx; background: rgba(0,0,0,0.5); color: rgba(255,255,255,0.5); border-radius: 32rpx; font-size: 22rpx; }

.info-panel { position: absolute; bottom: 120rpx; left: 0; right: 0; padding: 24rpx; background: linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0.7), transparent); transform: translateY(100%); opacity: 0; transition: all 0.3s; }
.info-panel.visible { transform: translateY(0); opacity: 1; }
.info-card { margin-bottom: 16rpx; }
.info-label { font-size: 22rpx; color: #6c63ff; display: block; margin-bottom: 8rpx; }
.info-content { font-size: 26rpx; color: #444; line-height: 1.6; word-break: break-all; }
.info-meta { background: rgba(0,0,0,0.03); border-radius: 12rpx; padding: 16rpx; }
.meta-row { display: flex; justify-content: space-between; padding: 8rpx 0; border-bottom: 1rpx solid rgba(0,0,0,0.05); }
.meta-row:last-child { border-bottom: none; }
.meta-label { font-size: 24rpx; color: #999; }
.meta-value { font-size: 24rpx; color: #333; }

.preview-footer { position: absolute; bottom: 0; left: 0; right: 0; display: flex; background: #fff; border-top: 1rpx solid rgba(0,0,0,0.06); padding: 16rpx 24rpx; }
.footer-btn { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8rpx; padding: 12rpx; border-radius: 16rpx; }
.footer-btn:active { background: rgba(108,99,255,0.1); }
.footer-icon { font-size: 40rpx; }
.footer-text { font-size: 20rpx; color: #666; }

.selectable { -webkit-user-select: text; user-select: text; }
</style>
