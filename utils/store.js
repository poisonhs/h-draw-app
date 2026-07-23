/**
 * H-DRAW 共享存储模块
 * 替代微信小程序 getApp() 的全局方法
 */
const STORAGE_KEYS = {
  API_CONFIG: 'hdraw_api_config',
  HISTORY: 'hdraw_history'
}

export function getApiConfig() {
  try {
    const raw = uni.getStorageSync(STORAGE_KEYS.API_CONFIG)
    if (!raw || typeof raw !== 'string' || raw.length === 0) return null
    return JSON.parse(raw)
  } catch (e) {
    console.error('读取 API 配置失败', e)
    return null
  }
}

export function saveApiConfig(config) {
  try {
    uni.setStorageSync(STORAGE_KEYS.API_CONFIG, JSON.stringify(config))
    return true
  } catch (e) {
    console.error('保存 API 配置失败', e)
    return false
  }
}

export function getHistory() {
  try {
    const data = uni.getStorageSync(STORAGE_KEYS.HISTORY)
    if (!data || typeof data !== 'string' || data.length === 0) return []
    return JSON.parse(data)
  } catch (e) {
    console.error('读取历史记录失败', e)
    return []
  }
}

export function saveHistory(history) {
  try {
    uni.setStorageSync(STORAGE_KEYS.HISTORY, JSON.stringify(history))
    return true
  } catch (e) {
    console.error('保存历史记录失败', e)
    return false
  }
}

export function addHistoryRecord(record) {
  const history = getHistory()
  record.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
  record.createTime = Date.now()
  history.unshift(record)
  saveHistory(history)
  return record.id
}

export function deleteHistoryRecord(id) {
  let history = getHistory()
  history = history.filter(item => item.id !== id)
  saveHistory(history)
  return true
}
