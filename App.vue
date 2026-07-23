<script>
import { checkUpdate } from './utils/checkUpdate'
export default {
  globalData: {
    apiConfig: null,
    currentResults: []
  },
  onLaunch() {
    console.log('H-DRAW App Launched')
    // 延迟几秒检查更新，不阻塞启动
    setTimeout(() => checkUpdate(), 3000)
  },
  methods: {
    getApiConfig() {
      try {
        const raw = uni.getStorageSync('hdraw_api_config')
        if (!raw) return null
        const config = JSON.parse(raw)
        this.globalData.apiConfig = config
        return config
      } catch (e) {
        console.error('读取 API 配置失败', e)
        return null
      }
    },
    saveApiConfig(config) {
      try {
        uni.setStorageSync('hdraw_api_config', JSON.stringify(config))
        this.globalData.apiConfig = config
        return true
      } catch (e) {
        console.error('保存 API 配置失败', e)
        return false
      }
    },
    getHistory() {
      try {
        const data = uni.getStorageSync('hdraw_history')
        if (!data || typeof data !== 'string' || data.length === 0) return []
        return JSON.parse(data)
      } catch (e) {
        console.error('读取历史记录失败', e)
        return []
      }
    },
    saveHistory(history) {
      try {
        uni.setStorageSync('hdraw_history', JSON.stringify(history))
        return true
      } catch (e) {
        console.error('保存历史记录失败', e)
        return false
      }
    },
    addHistoryRecord(record) {
      const history = this.getHistory()
      record.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
      record.createTime = Date.now()
      history.unshift(record)
      this.saveHistory(history)
      return record.id
    },
    deleteHistoryRecord(id) {
      let history = this.getHistory()
      history = history.filter(item => item.id !== id)
      this.saveHistory(history)
      return true
    }
  }
}
</script>

<style>
page {
  background-color: #ffffff;
  color: #333333;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 28rpx;
  box-sizing: border-box;
}

/* 通用卡片 */
.card {
  background: #f8f9fc;
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

/* 主按钮 */
.btn-primary {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  text-align: center;
  background: linear-gradient(135deg, #6c63ff 0%, #8b5cf6 100%);
  color: #ffffff;
  border-radius: 44rpx;
  font-size: 32rpx;
  font-weight: 600;
  border: none;
}
.btn-primary[disabled] { opacity: 0.4; }

/* 次要按钮 */
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 64rpx;
  padding: 0 28rpx;
  background: rgba(108, 99, 255, 0.08);
  color: #6c63ff;
  border-radius: 32rpx;
  font-size: 26rpx;
  border: 1rpx solid rgba(108, 99, 255, 0.2);
}

/* 输入框 */
.input-field {
  width: 100%;
  height: 80rpx;
  background: #f0f0f5;
  border: 1rpx solid rgba(0, 0, 0, 0.1);
  border-radius: 16rpx;
  padding: 0 24rpx;
  color: #333333;
  font-size: 28rpx;
  box-sizing: border-box;
}
.input-field:focus {
  border-color: #6c63ff;
  background: #ffffff;
}
</style>
