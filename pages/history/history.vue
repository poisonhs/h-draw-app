<template>
  <view class="history-page">
    
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">🔍</text>
        <input 
          class="search-input" 
          placeholder="搜索提示词..." 
          v-model="searchKeyword"
          @input="onSearchInput"
          placeholder-class="search-placeholder"
          confirm-type="search"
        />
        <view class="search-clear" v-if="searchKeyword" @click="clearSearch">
          <text>✕</text>
        </view>
      </view>
      <text class="search-count">{{filteredHistory.length}} / {{history.length}}</text>
    </view>

    <!-- 统计 -->
    <view class="stats-bar" v-if="history.length > 0">
      <view class="stat-item">
        <text class="stat-value">{{history.length}}</text>
        <text class="stat-label">总作品</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{todayCount}}</text>
        <text class="stat-label">今日</text>
      </view>
      <view class="stat-item">
        <text class="stat-value">{{ratioStats}}</text>
        <text class="stat-label">常用比例</text>
      </view>
    </view>

    <!-- 网格 -->
    <view class="history-grid" v-if="filteredHistory.length > 0">
      <view 
        v-for="(item, index) in filteredHistory" :key="item.id"
        class="grid-item"
        :class="{'selected': item.selected}"
        @click="onItemClick(item, index)"
        @longpress="onLongPress(item)"
      >
        <image class="grid-image" :src="item.imageUrl" mode="aspectFill" lazy-load="true" />
        <view class="grid-overlay">
          <text class="grid-prompt">{{item.prompt}}</text>
          <text class="grid-time">{{item.timeText}}</text>
        </view>
        <text class="grid-ratio-tag">{{item.aspectRatio || '1:1'}}</text>
        <view class="grid-check" v-if="selectMode && item.selected">
          <text class="check-icon">✓</text>
        </view>
      </view>
    </view>

    <!-- 选中工具栏 -->
    <view class="select-toolbar" v-if="selectMode">
      <button class="btn-secondary" @click="toggleSelectAll">{{isAllSelected ? '取消全选' : '全选'}}</button>
      <text class="selected-count">已选 {{selectedCount}} 项</text>
      <button class="btn-secondary" @click="cancelSelectMode">取消</button>
      <button class="btn-secondary btn-danger" @click="deleteSelected" v-if="selectedCount > 0">删除 ({{selectedCount}})</button>
    </view>

    <!-- 空状态 -->
    <view class="empty-state" v-if="filteredHistory.length === 0">
      <text class="empty-icon">🖼️</text>
      <text class="empty-title">{{searchKeyword ? '没有匹配的结果' : '还没有生成过图片'}}</text>
      <text class="empty-desc">{{searchKeyword ? '试试其他关键词' : '去生图页面创作吧'}}</text>
      <button class="btn-primary" v-if="!searchKeyword" @click="goToGenerate">✨ 去生成图片</button>
    </view>

    <view class="bottom-spacer"></view>
  </view>
</template>

<script>
import { getHistory, deleteHistoryRecord } from '../../utils/store'
import { formatTime } from '../../utils/util'

export default {
  data() {
    return {
      history: [],
      filteredHistory: [],
      searchKeyword: '',
      selectMode: false,
      isAllSelected: false,
      selectedCount: 0,
      todayCount: 0,
      ratioStats: '--'
    }
  },
  onShow() {
    this.loadHistory()
  },
  methods: {
    loadHistory() {
      const history = getHistory()
      const processed = history.map(item => ({ ...item, timeText: formatTime(item.createTime) }))
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
      const todayCount = processed.filter(item => item.createTime >= todayStart).length
      const ratioMap = {}
      processed.forEach(item => {
        const r = item.aspectRatio || '1:1'
        ratioMap[r] = (ratioMap[r] || 0) + 1
      })
      let commonRatio = '--', maxCount = 0
      for (const [ratio, count] of Object.entries(ratioMap)) {
        if (count > maxCount) { maxCount = count; commonRatio = ratio }
      }
      this.history = processed
      this.filteredHistory = processed
      this.todayCount = todayCount
      this.ratioStats = commonRatio
      this.selectMode = false; this.isAllSelected = false; this.selectedCount = 0
    },
    onSearchInput() {
      const keyword = (this.searchKeyword || '').trim().toLowerCase()
      this.filterHistory(keyword)
    },
    clearSearch() {
      this.searchKeyword = ''
      this.filterHistory('')
    },
    filterHistory(keyword) {
      if (!keyword) { this.filteredHistory = [...this.history]; return }
      this.filteredHistory = this.history.filter(item => (item.prompt || '').toLowerCase().includes(keyword))
    },
    onItemClick(item) {
      if (this.selectMode) {
        this.toggleItemSelect(item.id)
        return
      }
      uni.navigateTo({ url: `/pages/preview/preview?id=${item.id}` })
    },
    onLongPress(item) {
      if (!this.selectMode) {
        this.selectMode = true
        this.toggleItemSelect(item.id)
        uni.vibrateShort({ type: 'medium' })
      }
    },
    toggleItemSelect(id) {
      const toggle = (list) => {
        const item = list.find(i => i.id === id)
        if (item) this.$set(item, 'selected', !item.selected)
      }
      toggle(this.history)
      toggle(this.filteredHistory)
      const selectedCount = this.history.filter(i => i.selected).length
      const allFilteredSelected = this.filteredHistory.length > 0 && this.filteredHistory.every(i => i.selected)
      this.selectedCount = selectedCount
      this.isAllSelected = allFilteredSelected
    },
    toggleSelectAll() {
      const newState = !this.isAllSelected
      this.filteredHistory.forEach(item => { this.$set(item, 'selected', newState) })
      this.history.forEach(item => {
        const f = this.filteredHistory.find(i => i.id === item.id)
        if (f) this.$set(item, 'selected', f.selected)
      })
      this.isAllSelected = newState
      this.selectedCount = newState ? this.filteredHistory.length : 0
    },
    cancelSelectMode() {
      this.history.forEach(i => this.$set(i, 'selected', false))
      this.filteredHistory.forEach(i => this.$set(i, 'selected', false))
      this.selectMode = false; this.isAllSelected = false; this.selectedCount = 0
    },
    deleteSelected() {
      const count = this.selectedCount
      if (count === 0) return
      uni.showModal({
        title: '确认删除',
        content: `确定要删除选中的 ${count} 条记录吗？`,
        confirmColor: '#ff4757',
        success: (res) => {
          if (res.confirm) {
            this.history.filter(i => i.selected).forEach(i => deleteHistoryRecord(i.id))
            uni.showToast({ title: `已删除 ${count} 条`, icon: 'success' })
            this.loadHistory()
          }
        }
      })
    },
    goToGenerate() {
      uni.switchTab({ url: '/pages/index/index' })
    }
  }
}
</script>

<style scoped>
.history-page { padding: 24rpx; padding-bottom: 120rpx; min-height: 100vh; }

.search-bar { display: flex; align-items: center; gap: 16rpx; margin-bottom: 20rpx; }
.search-input-wrap { flex: 1; display: flex; align-items: center; background: #f5f5f8; border: 1rpx solid rgba(0,0,0,0.08); border-radius: 40rpx; padding: 0 20rpx; height: 72rpx; }
.search-input-wrap:focus-within { border-color: #6c63ff; }
.search-icon { font-size: 28rpx; margin-right: 12rpx; }
.search-input { flex: 1; height: 72rpx; color: #333; font-size: 26rpx; background: transparent; }
.search-placeholder { color: #bbb; font-size: 26rpx; }
.search-clear { padding: 8rpx 12rpx; color: #888; font-size: 24rpx; }
.search-count { font-size: 22rpx; color: #999; }

.stats-bar { display: flex; gap: 16rpx; margin-bottom: 20rpx; }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16rpx; background: #f5f5f8; border: 1rpx solid rgba(0,0,0,0.06); border-radius: 16rpx; }
.stat-value { font-size: 36rpx; font-weight: 700; color: #6c63ff; }
.stat-label { font-size: 22rpx; color: #999; margin-top: 4rpx; }

.history-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16rpx; }
.grid-item { position: relative; border-radius: 16rpx; overflow: hidden; aspect-ratio: 1; background: #f0f0f5; border: 2rpx solid rgba(0,0,0,0.06); }
.grid-item.selected { border-color: #6c63ff; box-shadow: 0 0 20rpx rgba(108,99,255,0.2); }
.grid-image { width: 100%; height: 100%; display: block; }
.grid-overlay { position: absolute; bottom: 0; left: 0; right: 0; padding: 40rpx 16rpx 16rpx; background: linear-gradient(transparent, rgba(0,0,0,0.85)); }
.grid-prompt { font-size: 24rpx; color: #fff; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; word-break: break-all; }
.grid-time { font-size: 20rpx; color: rgba(255,255,255,0.5); margin-top: 6rpx; display: block; }
.grid-ratio-tag { position: absolute; top: 12rpx; right: 12rpx; padding: 4rpx 12rpx; background: rgba(0,0,0,0.6); color: rgba(255,255,255,0.7); font-size: 18rpx; border-radius: 8rpx; }
.grid-check { position: absolute; top: 12rpx; left: 12rpx; width: 40rpx; height: 40rpx; background: #6c63ff; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.check-icon { color: #fff; font-size: 24rpx; font-weight: bold; }

.select-toolbar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1rpx solid rgba(0,0,0,0.08); padding: 16rpx 24rpx; display: flex; align-items: center; gap: 16rpx; z-index: 100; }
.selected-count { flex: 1; text-align: center; font-size: 24rpx; color: #888; }

.empty-state { display: flex; flex-direction: column; align-items: center; padding: 120rpx 40rpx; }
.empty-icon { font-size: 120rpx; margin-bottom: 24rpx; opacity: 0.3; }
.empty-title { font-size: 32rpx; font-weight: 600; color: #888; margin-bottom: 12rpx; }
.empty-desc { font-size: 26rpx; color: #999; margin-bottom: 40rpx; }

.bottom-spacer { height: 40rpx; }
</style>
