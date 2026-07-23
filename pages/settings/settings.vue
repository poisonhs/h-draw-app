<template>
  <view class="settings-page">
    
    <!-- API 配置 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">🔌 API 配置</text>
      </view>

      <view class="form-group">
        <text class="form-label">完整 API 端点</text>
        <input class="input-field" placeholder="https://app.hdraw.de/v1/chat/completions" v-model="apiEndpoint" @input="onEndpointInput" />
        <text class="form-hint">完整的 API URL，或使用下方的快捷构造</text>
      </view>

      <view class="divider-text">— 快捷构造 —</view>

      <view class="form-group">
        <text class="form-label">API 域名</text>
        <view class="domain-format-row">
          <input class="input-field domain-input" placeholder="https://app.hdraw.de" v-model="apiDomain" @input="rebuildEndpoint" />
          <view class="format-selector">
            <view 
              class="format-tag" 
              :class="apiFormat === 'chat' ? 'active' : ''"
              @click="selectFormat('chat')"
            >Chat</view>
            <view 
              class="format-tag" 
              :class="apiFormat === 'images' ? 'active' : ''"
              @click="selectFormat('images')"
            >Images</view>
          </view>
        </view>
        <text class="form-hint">输入域名后自动拼接 /v1/chat/completions 或 /v1/images/generations</text>
      </view>

      <view class="form-group">
        <text class="form-label">API 密钥</text>
        <view class="password-input-wrap">
          <input class="input-field password-input" placeholder="sk-..." v-model="apiKey" :password="!showApiKey" />
          <view class="toggle-visibility" @click="toggleApiKeyVisibility">
            <text>{{showApiKey ? '🙈' : '👁️'}}</text>
          </view>
        </view>
        <text class="form-hint">密钥将加密存储在本地</text>
      </view>

      <view class="form-group">
        <text class="form-label">模型名称</text>
        <view class="model-select-row">
          <input class="input-field model-input" placeholder="gpt-4o / dall-e-3" v-model="model" @input="onModelInput" />
          <button class="btn-secondary fetch-btn" @click="onFetchModels" :disabled="!getFullEndpoint() || !apiKey">{{fetchingModels ? '加载中...' : '获取模型'}}</button>
        </view>
        <text class="form-hint">选择或输入模型名称</text>
        
        <view class="model-dropdown" v-if="modelList.length > 0 && showModelDropdown">
          <view v-for="m in modelList" :key="m" class="dropdown-item" :class="{'selected': model === m}" @click="selectModel(m)">
            <text class="model-name">{{m}}</text>
            <text class="model-check" v-if="model === m">✓</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 连接测试 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">🧪 连接测试</text>
      </view>
      <button class="btn-secondary test-btn" @click="onTestConnection" :disabled="!getFullEndpoint() || !apiKey || testing">
        {{testing ? '测试中...' : '测试 API 连接'}}
      </button>
      <view class="test-result" v-if="testResult">
        <text class="result-icon">{{testResult.success ? '✅' : '❌'}}</text>
        <view class="result-body">
          <text class="result-title" :class="testResult.success ? 'success' : 'fail'">{{testResult.success ? '连接成功' : '连接失败'}}</text>
          <text class="result-message">{{testResult.message}}</text>
          <text class="result-model" v-if="testResult.model">{{'模型: ' + testResult.model}}</text>
        </view>
      </view>
    </view>

    <!-- 操作 -->
    <view class="action-area">
      <button class="btn-primary" @click="saveSettings" :disabled="saving">{{saving ? '保存中...' : '💾 保存配置'}}</button>
      <button class="btn-secondary reset-btn" @click="resetSettings">🔄 重置到默认</button>
    </view>

  </view>
</template>

<script>
import { encryptApiKey, decryptApiKey } from '../../utils/crypto'
import { testConnection, fetchModels } from '../../utils/api'
import { getApiConfig, saveApiConfig } from '../../utils/store'

export default {
  data() {
    return {
      apiEndpoint: '',     // 完整 API URL（主要输入）
      apiDomain: '',       // 域名（辅助输入）
      apiFormat: 'chat',   // Chat / Images
      apiKey: '',
      model: '',
      showApiKey: false,
      showModelDropdown: false,
      saving: false,
      testing: false,
      fetchingModels: false,
      modelList: [],
      testResult: null,
      isConfigured: false,
      _ignoreEndpointUpdate: false  // 防止循环更新
    }
  },
  onLoad() { this.loadConfig() },
  onShow() { this.loadConfig() },
  methods: {
    extractDomain(url) {
      if (!url) return ''
      // 提取 /v1/ 之前的部分作为基础域名（保留前缀路径）
      const match = url.match(/^(https?:\/\/[^/]+(?:\/[^/]+)*?)(?:\/v1\/|$)/)
      if (match) return match[1]
      // 兜底：直接用 origin
      try { return new URL(url).origin }
      catch { return url }
    },
    detectFormat(url) {
      if (!url) return 'chat'
      return url.includes('/images/generations') ? 'images' : 'chat'
    },
    buildEndpoint(domain, format) {
      const d = domain.replace(/\/+$/, '')
      if (!d) return ''
      if (format === 'images') return d + '/v1/images/generations'
      return d + '/v1/chat/completions'
    },
    getFullEndpoint() {
      // 直接返回完整 URL 字段（用户可手动输入，也可由下方快捷构造填充）
      const url = this.apiEndpoint.trim()
      if (url) return url
      // 后备：从域名+格式拼接
      return this.buildEndpoint(this.apiDomain.trim(), this.apiFormat)
    },
    onEndpointInput() {
      // 用户手动输入完整 URL → 同步提取域名和格式到辅助字段
      this._ignoreEndpointUpdate = true
      const url = this.apiEndpoint.trim()
      if (url) {
        const extracted = this.extractDomain(url)
        if (extracted) {
          this.apiDomain = extracted
          this.apiFormat = this.detectFormat(url)
        }
      }
      this._ignoreEndpointUpdate = false
      this.showModelDropdown = false
    },
    rebuildEndpoint() {
      // 域名或格式变化 → 自动填充完整 URL 字段
      if (this._ignoreEndpointUpdate) return
      const built = this.buildEndpoint(this.apiDomain.trim(), this.apiFormat)
      if (built) {
        this.apiEndpoint = built
      }
      this.showModelDropdown = false
    },
    selectFormat(f) {
      this.apiFormat = f
      this.rebuildEndpoint()
      uni.vibrateShort({ type: 'light' })
    },
    loadConfig() {
      const config = getApiConfig()
      if (config && config.apiEndpoint) {
        this.apiEndpoint = config.apiEndpoint
        this.apiDomain = this.extractDomain(config.apiEndpoint)
        this.apiFormat = this.detectFormat(config.apiEndpoint)
        const decrypted = config.apiKey ? decryptApiKey(config.apiKey) : ''
        this.apiKey = decrypted
        this.model = config.model || ''
        this.isConfigured = true
        
        // 检测密钥是否已损坏（Crypto 格式迁移后旧密钥可能已不可恢复）
        if (config.apiKey && !decrypted) {
          console.warn('[设置] API Key 解密失败，请重新输入')
          uni.showToast({ title: '⚠️ 密钥解析失败，请重新输入API Key', icon: 'none', duration: 3000 })
        } else if (config.apiKey && decrypted && (
          /[\x00-\x20\x7F-\xFF]/.test(decrypted) ||                      // 含控制字符或非ASCII
          (!decrypted.startsWith('sk-') && decrypted.length < 6) ||      // 非 sk- 开头且太短
          (decrypted.length >= 20 && !/^[a-zA-Z0-9_\-.:~\#]+$/.test(decrypted)) // 长密钥但有非法字符
        )) {
          console.warn('[设置] API Key 解密结果异常:', JSON.stringify(decrypted))
          uni.showToast({ title: '⚠️ 密钥格式异常（可能已损坏），请重新输入', icon: 'none', duration: 3000 })
        }
      }
      this._ignoreEndpointUpdate = false
    },
    onDomainInput() {
      this.rebuildEndpoint()
      this.showModelDropdown = false
    },
    onModelInput() { this.showModelDropdown = true },
    toggleApiKeyVisibility() { this.showApiKey = !this.showApiKey },
    selectModel(m) { this.model = m; this.showModelDropdown = false; uni.vibrateShort({ type: 'light' }) },
    async onFetchModels() {
      const endpoint = this.getFullEndpoint()
      if (!endpoint || !this.apiKey) { uni.showToast({ title: '请先填写 API 地址和密钥', icon: 'none' }); return }
      this.fetchingModels = true; this.showModelDropdown = true
      try {
        const tmp = { apiEndpoint: endpoint, apiKey: encryptApiKey(this.apiKey.trim()) }
        uni.setStorageSync('hdraw_api_config', JSON.stringify(tmp))
        const models = await fetchModels()
        this.modelList = models; this.fetchingModels = false
        if (models.length === 0) uni.showToast({ title: '该 API 不提供模型列表', icon: 'none' })
        else uni.showToast({ title: `获取到 ${models.length} 个模型`, icon: 'success' })
      } catch (err) {
        this.fetchingModels = false; this.modelList = []
        uni.showToast({ title: `获取失败: ${err.message}`, icon: 'none' })
      }
    },
    async onTestConnection() {
      const endpoint = this.getFullEndpoint()
      if (!endpoint || !this.apiKey) { uni.showToast({ title: '请先填写 API 地址和密钥', icon: 'none' }); return }
      this.testing = true; this.testResult = null
      const tmp = { apiEndpoint: endpoint, apiKey: encryptApiKey(this.apiKey.trim()), model: this.model.trim() }
      uni.setStorageSync('hdraw_api_config', JSON.stringify(tmp))
      try {
        const result = await testConnection()
        this.testing = false; this.testResult = result
      } catch (err) {
        this.testing = false; this.testResult = { success: false, message: `测试异常: ${err.message}` }
      }
    },
    async saveSettings() {
      const endpoint = this.getFullEndpoint()
      if (!endpoint) { uni.showToast({ title: '请输入 API 地址', icon: 'none' }); return }
      if (!this.apiKey.trim()) { uni.showToast({ title: '请输入 API 密钥', icon: 'none' }); return }
      if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) { uni.showToast({ title: '地址必须是 HTTP/HTTPS', icon: 'none' }); return }
      this.saving = true
      try {
        const config = { apiEndpoint: endpoint, apiKey: encryptApiKey(this.apiKey.trim()), model: this.model.trim() }
        saveApiConfig(config)
        this.isConfigured = true; this.saving = false
        uni.showToast({ title: '✅ 配置已保存', icon: 'success' })
      } catch (e) { this.saving = false; uni.showToast({ title: '保存失败', icon: 'none' }) }
    },
    resetSettings() {
      uni.showModal({
        title: '重置配置',
        content: '确定要清空所有配置吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('hdraw_api_config')
            this.apiEndpoint = ''; this.apiDomain = ''; this.apiFormat = 'chat'; this.apiKey = ''; this.model = ''
            this.testResult = null; this.modelList = []; this.showModelDropdown = false; this.isConfigured = false
            this._ignoreEndpointUpdate = false
            uni.showToast({ title: '已重置', icon: 'success' })
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.settings-page { padding: 24rpx; padding-bottom: 60rpx; min-height: 100vh; }

.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; }
.card-title { font-size: 30rpx; font-weight: 600; color: #333; }

.form-group { margin-bottom: 28rpx; }
.form-label { font-size: 26rpx; color: #333; display: block; margin-bottom: 12rpx; font-weight: 500; }
.form-hint { font-size: 22rpx; color: #999; margin-top: 8rpx; display: block; }

/* 密码输入 */
.password-input-wrap { position: relative; }
.password-input { padding-right: 80rpx !important; }
.toggle-visibility { position: absolute; right: 16rpx; top: 50%; transform: translateY(-50%); padding: 8rpx; font-size: 32rpx; }

.model-select-row { display: flex; gap: 16rpx; align-items: center; }
.model-input { flex: 1; }
.fetch-btn { flex-shrink: 0; height: 72rpx; padding: 0 24rpx; font-size: 24rpx; white-space: nowrap; }

.domain-format-row { display: flex; gap: 12rpx; align-items: stretch; }
.domain-input { flex: 1; }

/* 短格式选择标签 */
.format-selector { display: flex; gap: 8rpx; align-items: stretch; flex-shrink: 0; }
.format-tag {
  display: flex; align-items: center; justify-content: center;
  padding: 0 20rpx; background: #f5f5f8; border: 1rpx solid rgba(0,0,0,0.08);
  border-radius: 12rpx; font-size: 24rpx; font-weight: 600; color: #666; cursor: pointer;
}
.format-tag.active { background: rgba(108,99,255,0.1); border-color: #6c63ff; color: #6c63ff; }
.format-tag:active { transform: scale(0.94); }

.divider-text { text-align: center; color: #ccc; font-size: 22rpx; margin: 16rpx 0; }

.model-dropdown { margin-top: 8rpx; background: #fff; border: 1rpx solid rgba(0,0,0,0.1); border-radius: 12rpx; max-height: 400rpx; overflow-y: auto; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.08); }
.dropdown-item { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 24rpx; border-bottom: 1rpx solid rgba(0,0,0,0.04); }
.dropdown-item:last-child { border-bottom: none; }
.dropdown-item:active { background: rgba(108,99,255,0.06); }
.dropdown-item.selected { background: rgba(108,99,255,0.06); }
.model-name { font-size: 26rpx; color: #333; font-family: monospace; }
.dropdown-item.selected .model-name { color: #6c63ff; }
.model-check { font-size: 24rpx; color: #6c63ff; }

.test-btn { width: 100%; margin-bottom: 16rpx; }
.test-result { display: flex; gap: 16rpx; padding: 20rpx; background: #f5f5f8; border-radius: 12rpx; margin-top: 16rpx; }
.result-icon { font-size: 48rpx; }
.result-body { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.result-title { font-size: 28rpx; font-weight: 600; }
.result-title.success { color: #2ed573; }
.result-title.fail { color: #ff4757; }
.result-message { font-size: 24rpx; color: #666; word-break: break-all; }
.result-model { font-size: 22rpx; color: #6c63ff; margin-top: 4rpx; }

.action-area { margin-top: 32rpx; display: flex; flex-direction: column; gap: 16rpx; }
.reset-btn { width: 100%; justify-content: center; height: 80rpx; }
</style>
