<template>
  <view class="generate-page">
    
    <!-- 上部输入区 -->
    <view class="top-section">
      
      <!-- 提示词卡片 -->
      <view class="prompt-card">
        <view class="card-header">
          <text class="card-title">🎨 提示词</text>
          <text class="word-count">{{prompt.length}}/1000</text>
        </view>
        <view class="prompt-area">
          <textarea 
            class="prompt-input"
            placeholder="输入图片描述..."
            v-model="prompt"
            @input="onPromptInput"
            maxlength="1000"
            auto-height
            :show-confirm-bar="false"
            placeholder-class="prompt-placeholder"
          />
          <!-- 尺寸选择器（右下角） -->
          <view class="ratio-trigger" @click="toggleRatioDropdown"><text class="ratio-trigger-value">{{selectedRatio}}</text><text class="ratio-trigger-arrow">▾</text></view>
          <!-- 下拉面板 -->
          <view class="ratio-dropdown" v-if="showRatioDropdown">
            <view 
              v-for="r in ratios" :key="r.value"
              class="ratio-dropdown-item"
              :class="{ active: selectedRatio === r.value }"
              @click="selectRatio(r.value)"
            >
              <view class="ratio-item-left">
                <view class="ratio-preview" :class="'ratio-' + r.value.replace(':', '-')"></view>
                <text class="ratio-dd-label">{{r.label || r.value}}</text>
              </view>
              <text class="ratio-dd-check" v-if="selectedRatio === r.value">✓</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 生成按钮行 -->
      <view class="generate-row">
        <view 
          class="generate-btn"
          :class="{ disabled: !promptTrimmed || isGenerating }"
          hover-class="btn-hover"
          @click="onGenerate"
        >
          <view v-if="!isGenerating" class="btn-content">
            <text class="btn-icon">✨</text>
            <text class="btn-label">生成</text>
          </view>
          <view v-else class="btn-content">
            <view class="loading-spinner"></view>
            <text class="btn-label">生成中</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 下部结果区 -->
    <view class="bottom-section">
      <view class="image-wrap" v-if="resultImageUrl">
        <image 
          class="result-image" 
          :src="resultImageUrl" 
          mode="aspectFit"
          @load="onImageLoad"
          @error="onImageError"
        />
      </view>

      <view class="result-actions" v-if="resultImageUrl">
        <view class="action-btn" @click="onCopyPrompt">
          <text class="action-btn-icon">📋</text>
          <text class="action-btn-text">复制提示词</text>
        </view>
        <view class="action-btn" @click="onDownloadImage">
          <text class="action-btn-icon">💾</text>
          <text class="action-btn-text">下载图片</text>
        </view>
        <view class="action-btn" @click="onGenerateNew">
          <text class="action-btn-icon">🔄</text>
          <text class="action-btn-text">继续生图</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-if="!resultImageUrl && !isGenerating && !promptTrimmed">
        <text class="empty-icon">🎨</text>
        <text class="empty-title">H-DRAW</text>
        <text class="empty-desc">AI 图片生成</text>
      </view>

      <!-- 状态提示 -->
      <view class="status-line" v-if="statusMessage">
        <text class="status-text" :class="statusType">{{statusMessage}}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { generateImage } from '../../utils/api'
import { copyToClipboard, downloadImage } from '../../utils/util'
import { addHistoryRecord, getApiConfig } from '../../utils/store'

export default {
  data() {
    return {
      prompt: '',
      promptTrimmed: '',
      selectedRatio: '1:1',
      showRatioDropdown: false,
      isGenerating: false,
      statusMessage: '',
      statusType: 'info',
      resultImageUrl: null,
      imageLoadError: false,
      ratios: [
        { value: '1:1', label: '1:1 方形' },
        { value: '4:3', label: '4:3 横版' },
        { value: '3:4', label: '3:4 竖版' },
        { value: '16:9', label: '16:9 宽屏' },
        { value: '9:16', label: '9:16 长屏' }
      ]
    }
  },
  onLoad() {
    this.checkConfig()
  },
  onShow() {
    this.checkConfig()
  },
  methods: {
    checkConfig() {
      const config = getApiConfig()
      if (!config) {
        this.statusMessage = '⚠️ 请先在「设置」中配置 API 信息'
        this.statusType = 'warning'
      } else {
        if (this.statusType === 'warning' && this.statusMessage.includes('设置')) {
          this.statusMessage = ''
          this.statusType = 'info'
        }
      }
    },
    onPromptInput(e) {
      const val = e.detail.value || ''
      this.prompt = val
      this.promptTrimmed = val.trim()
    },
    toggleRatioDropdown() {
      this.showRatioDropdown = !this.showRatioDropdown
    },
    selectRatio(val) {
      this.selectedRatio = val
      this.showRatioDropdown = false
      uni.vibrateShort({ type: 'light' })
    },
    async onGenerate() {
      if (this.isGenerating || !this.promptTrimmed) return
      const prompt = this.prompt.trim()
      if (!prompt) {
        uni.showToast({ title: '请输入提示词', icon: 'none' })
        return
      }
      const config = getApiConfig()
      if (!config) {
        uni.showToast({ title: '请先配置 API', icon: 'none' })
        uni.switchTab({ url: '/pages/settings/settings' })
        return
      }

      this.isGenerating = true
      this.statusMessage = '⏳ 正在生成图片，请稍候...'
      this.statusType = 'loading'
      this.resultImageUrl = null
      this.imageLoadError = false

      try {
        const result = await generateImage(prompt, this.selectedRatio)
        if (result.imageUrl) {
          this.resultImageUrl = result.imageUrl
          this.isGenerating = false
          this.statusMessage = '✅ 图片生成完成！'
          this.statusType = 'success'

          addHistoryRecord({
            prompt: result.revisedPrompt || prompt,
            imageUrl: result.imageUrl,
            aspectRatio: this.selectedRatio,
            revisedPrompt: result.revisedPrompt || prompt
          })
          uni.vibrateShort({ type: 'medium' })
        } else {
          this.isGenerating = false
          this.statusMessage = '⚠️ 未能解析图片，请检查 API 返回格式'
          this.statusType = 'error'
        }
      } catch (err) {
        this.isGenerating = false
        this.statusMessage = `❌ 生成失败：${err.message}`
        this.statusType = 'error'
      }
    },
    onImageLoad() {
      this.imageLoadError = false
    },
    onImageError() {
      this.imageLoadError = true
      this.statusMessage = '❌ 图片加载失败，链接可能已过期'
      this.statusType = 'error'
    },
    async onCopyPrompt() {
      if (this.prompt) {
        await copyToClipboard(this.prompt)
      }
    },
    async onDownloadImage() {
      if (this.resultImageUrl) {
        try { await downloadImage(this.resultImageUrl) } catch (e) {}
      }
    },
    onGenerateNew() {
      this.resultImageUrl = null
      this.statusMessage = ''
      this.statusType = 'info'
      this.imageLoadError = false
    }
  }
}
</script>

<style scoped>
.generate-page {
  display: flex; flex-direction: column;
  height: 100vh; padding: 20rpx 24rpx;
  box-sizing: border-box;
}

.top-section { flex-shrink: 0; }

.prompt-card {
  background: #f8f9fc;
  border-radius: 20rpx; padding: 20rpx 24rpx;
  border: 1rpx solid rgba(0,0,0,0.06); margin-bottom: 16rpx;
}
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.card-title { font-size: 28rpx; font-weight: 600; color: #333; }
.word-count { font-size: 22rpx; color: #999; }

.prompt-input {
  width: 100%; min-height: 180rpx;
  background: #fff;
  border: 1rpx solid rgba(0,0,0,0.12); border-radius: 14rpx;
  padding: 22rpx 22rpx 56rpx 22rpx; color: #333; font-size: 24rpx; line-height: 1.6;
  box-sizing: border-box;
}
.prompt-input:focus { border-color: #6c63ff; }
.prompt-placeholder { color: #bbb; font-size: 28rpx; }

.prompt-area { position: relative; }

.ratio-trigger {
  position: absolute; bottom: 16rpx; left: 16rpx;
  display: inline-flex; align-items: center; gap: 6rpx;
  padding: 6rpx 14rpx 6rpx 12rpx;
  background: rgba(255,255,255,0.94);
  border: 1rpx solid rgba(0,0,0,0.07);
  border-radius: 10rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04);
  font-size: 22rpx; z-index: 5;
}
.ratio-trigger:active { background: #f5f5f8; transform: scale(0.96); }
.ratio-trigger-label { color: #999; font-weight: 400; }
.ratio-trigger-value { color: #333; font-weight: 600; margin-left: 2rpx; }
.ratio-trigger-arrow { font-size: 16rpx; color: #bbb; margin-left: 2rpx; transition: transform .2s; }
.ratio-trigger-arrow.open { transform: rotate(180deg); }

.ratio-dropdown {
  position: absolute; left: 16rpx; top: calc(100% + 6rpx);
  background: #fff; border-radius: 14rpx;
  border: 1rpx solid rgba(0,0,0,0.07);
  box-shadow: 0 8rpx 32rpx rgba(0,0,0,0.12);
  z-index: 20; overflow: hidden;
  min-width: 220rpx;
}
.ratio-dropdown-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20rpx 22rpx;
  border-bottom: 1rpx solid rgba(0,0,0,0.04);
  transition: background .15s;
}
.ratio-dropdown-item:last-child { border-bottom: none; }
.ratio-dropdown-item:active { background: #f5f5ff; }
.ratio-dropdown-item.active { background: rgba(108,99,255,0.06); }

.ratio-item-left { display: flex; align-items: center; gap: 14rpx; }

.ratio-preview {
  width: 40rpx; height: 28rpx; border-radius: 4rpx;
  background: linear-gradient(135deg, #6c63ff, #8b5cf6);
  flex-shrink: 0; opacity: 0.7;
}
.ratio-dropdown-item.active .ratio-preview { opacity: 1; }
.ratio-1-1 { width: 28rpx; height: 28rpx; }
.ratio-4-3 { width: 36rpx; height: 27rpx; }
.ratio-3-4 { width: 27rpx; height: 36rpx; }
.ratio-16-9 { width: 40rpx; height: 22.5rpx; }
.ratio-9-16 { width: 22.5rpx; height: 40rpx; }

.ratio-dd-label { font-size: 26rpx; color: #333; font-weight: 500; }
.ratio-dropdown-item.active .ratio-dd-label { color: #6c63ff; }
.ratio-dd-check { font-size: 22rpx; color: #6c63ff; font-weight: 700; }

.generate-row { display: flex; }
.generate-btn {
  flex: 1; height: 88rpx;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #6c63ff 0%, #8b5cf6 100%);
  color: #fff; border-radius: 20rpx; font-size: 30rpx; font-weight: 600;
  box-shadow: 0 6rpx 20rpx rgba(108,99,255,0.3);
}
.generate-btn.disabled { opacity: 0.4; box-shadow: none; }
.btn-hover { transform: scale(0.95); }
.btn-content { display: flex; flex-direction: column; align-items: center; justify-content: center; }
.btn-icon { font-size: 28rpx; line-height: 1.3; }
.btn-label { font-size: 22rpx; line-height: 1.3; }

.loading-spinner {
  width: 28rpx; height: 28rpx;
  border: 3rpx solid rgba(255,255,255,0.3); border-top-color: #fff;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.bottom-section { flex: 1; display: flex; flex-direction: column; justify-content: center; min-height: 0; margin-top: 12rpx; }

.image-wrap {
  flex: 1; display: flex; align-items: center; justify-content: center;
  background: #f5f5f8; border-radius: 16rpx; overflow: hidden;
  border: 1rpx solid rgba(0,0,0,0.06); min-height: 0;
}
.result-image { width: 100%; height: 100%; display: block; }

.result-actions { display: flex; gap: 14rpx; margin-top: 14rpx; flex-shrink: 0; }
.action-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8rpx;
  padding: 14rpx 0; background: #f5f5f8;
  border: 1rpx solid rgba(0,0,0,0.06); border-radius: 14rpx;
}
.action-btn:active { background: rgba(108,99,255,0.08); transform: scale(0.96); }
.action-btn-icon { font-size: 34rpx; }
.action-btn-text { font-size: 24rpx; color: #666; }

.empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.empty-icon { font-size: 100rpx; margin-bottom: 16rpx; opacity: 0.4; animation: float 3s ease-in-out infinite; }
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-20rpx); } }
.empty-title { font-size: 40rpx; font-weight: 700; color: #6c63ff; letter-spacing: 8rpx; margin-bottom: 8rpx; }
.empty-desc { font-size: 26rpx; color: #999; }

.status-line { flex-shrink: 0; text-align: center; padding: 8rpx 0; }
.status-text { font-size: 24rpx; line-height: 1.4; }
.status-text.loading { color: #6c63ff; }
.status-text.success { color: #2ed573; }
.status-text.error { color: #ff4757; }
.status-text.warning { color: #ffa502; }
</style>
