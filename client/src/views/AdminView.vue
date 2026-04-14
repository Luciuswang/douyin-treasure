<template>
  <div class="admin-page">
    <div class="admin-header">
      <h2>管理后台</h2>
      <div class="admin-tabs">
        <button :class="{ active: tab === 'review' }" @click="tab = 'review'">
          待审核 <span v-if="stats.pendingReview" class="tab-badge">{{ stats.pendingReview }}</span>
        </button>
        <button :class="{ active: tab === 'users' }" @click="tab = 'users'; loadUsers()">用户管理</button>
        <button :class="{ active: tab === 'stats' }" @click="tab = 'stats'">数据概览</button>
      </div>
    </div>

    <!-- 数据概览 -->
    <div v-if="tab === 'stats'" class="stats-grid">
      <div class="stat-card">
        <span class="stat-num">{{ stats.totalUsers || 0 }}</span>
        <span class="stat-label">注册用户</span>
      </div>
      <div class="stat-card">
        <span class="stat-num">{{ stats.totalTreasures || 0 }}</span>
        <span class="stat-label">宝藏总数</span>
      </div>
      <div class="stat-card warn">
        <span class="stat-num">{{ stats.pendingReview || 0 }}</span>
        <span class="stat-label">待审核</span>
      </div>
      <div class="stat-card danger">
        <span class="stat-num">{{ stats.bannedTreasures || 0 }}</span>
        <span class="stat-label">已封禁</span>
      </div>
    </div>

    <!-- 待审核列表 -->
    <div v-if="tab === 'review'" class="review-list">
      <div v-if="loading" class="loading-text">加载中...</div>
      <div v-else-if="!reviewItems.length" class="empty-text">暂无待审核内容</div>
      <div v-for="t in reviewItems" :key="t._id" class="review-card">
        <div class="rc-header">
          <span class="rc-type">{{ typeLabels[t.type] || t.type }}</span>
          <span class="rc-time">{{ formatTime(t.updatedAt) }}</span>
        </div>
        <h4>{{ t.title }}</h4>
        <p class="rc-desc">{{ t.description }}</p>
        <div class="rc-meta">
          <span>发布者: {{ t.creator?.username || '未知' }}</span>
          <span>信用分: {{ t.creator?.credit?.score ?? '?' }}</span>
          <span>举报数: {{ t.reportCount }}</span>
        </div>
        <div class="rc-reports" v-if="t.reports?.length">
          <div v-for="(r, i) in t.reports" :key="i" class="rc-report-item">
            <span class="rc-reason">{{ reasonLabels[r.reason] || r.reason }}</span>
            <span v-if="r.detail" class="rc-detail">{{ r.detail }}</span>
          </div>
        </div>
        <div class="rc-actions">
          <button class="btn-approve" @click="approve(t._id)" :disabled="actionLoading">通过</button>
          <button class="btn-reject" @click="reject(t._id)" :disabled="actionLoading">驳回并封禁</button>
        </div>
      </div>
    </div>

    <!-- 用户管理 -->
    <div v-if="tab === 'users'" class="user-list">
      <div class="user-sort">
        <button :class="{ active: userSort === 'time' }" @click="userSort = 'time'; loadUsers()">按时间</button>
        <button :class="{ active: userSort === 'credit' }" @click="userSort = 'credit'; loadUsers()">按信用分</button>
      </div>
      <div v-if="loading" class="loading-text">加载中...</div>
      <div v-for="u in userList" :key="u._id" class="user-card">
        <div class="uc-main">
          <strong>{{ u.username }}</strong>
          <span class="uc-role" :class="u.role">{{ u.role }}</span>
          <span class="uc-credit" :class="creditClass(u.credit?.score)">{{ u.credit?.score ?? 100 }}分</span>
        </div>
        <div class="uc-meta">
          <span>Lv.{{ u.level?.currentLevel || 1 }}</span>
          <span>发布 {{ u.stats?.treasuresCreated || 0 }}</span>
          <span>发现 {{ u.stats?.treasuresDiscovered || 0 }}</span>
          <span v-if="u.credit?.banUntil && new Date(u.credit.banUntil) > new Date()" class="uc-banned">
            封禁至 {{ formatTime(u.credit.banUntil) }}
          </span>
        </div>
        <div class="uc-warnings" v-if="u.credit?.warnings?.length">
          <span v-for="(w, i) in u.credit.warnings.slice(-3)" :key="i" class="uc-warn-tag">{{ w.reason }}</span>
        </div>
        <div class="uc-actions" v-if="u.role !== 'admin'">
          <button class="btn-sm btn-warn" @click="warnUser(u._id)">警告 -10</button>
          <button class="btn-sm btn-ban" @click="banUser(u._id)">封禁 7天</button>
          <button v-if="u.credit?.banUntil" class="btn-sm btn-restore" @click="restoreUser(u._id)">解封</button>
        </div>
      </div>
    </div>

    <p v-if="actionMsg" class="action-msg" :class="{ 'action-err': actionErr }">{{ actionMsg }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api.js'

const tab = ref('review')
const loading = ref(false)
const reviewItems = ref([])
const userList = ref([])
const userSort = ref('time')
const stats = ref({})
const actionLoading = ref(false)
const actionMsg = ref('')
const actionErr = ref(false)

const typeLabels = {
  note: '笔记', coupon: '优惠券', ticket: '门票', job: '招聘',
  event: '活动', redpacket: '红包', task: '任务', custom: '自定义',
  social: '交友', house: '房屋', image: '图片'
}

const reasonLabels = {
  dangerous_location: '位置危险',
  inappropriate_content: '不当内容',
  spam: '垃圾信息',
  fraud: '虚假信息',
  misleading_info: '误导内容',
  expired_invalid: '已失效',
  other: '其他'
}

onMounted(async () => {
  await Promise.all([loadReview(), loadStats()])
})

async function loadStats() {
  try {
    const res = await api.get('/admin/stats')
    if (res.success) stats.value = res.data
  } catch {}
}

async function loadReview() {
  loading.value = true
  try {
    const res = await api.get('/admin/review')
    if (res.success) reviewItems.value = res.data
  } catch (err) {
    showMsg(err.message || '加载失败', true)
  } finally {
    loading.value = false
  }
}

async function loadUsers() {
  loading.value = true
  try {
    const res = await api.get('/admin/users', { params: { sort: userSort.value } })
    if (res.success) userList.value = res.data
  } catch (err) {
    showMsg(err.message || '加载失败', true)
  } finally {
    loading.value = false
  }
}

async function approve(id) {
  actionLoading.value = true
  try {
    const res = await api.post(`/admin/review/${id}/approve`)
    showMsg(res.message)
    reviewItems.value = reviewItems.value.filter(t => t._id !== id)
    stats.value.pendingReview = Math.max(0, (stats.value.pendingReview || 1) - 1)
  } catch (err) {
    showMsg(err.message || '操作失败', true)
  } finally {
    actionLoading.value = false
  }
}

async function reject(id) {
  actionLoading.value = true
  try {
    const res = await api.post(`/admin/review/${id}/reject`, { reason: '管理员审核驳回' })
    showMsg(res.message)
    reviewItems.value = reviewItems.value.filter(t => t._id !== id)
    stats.value.pendingReview = Math.max(0, (stats.value.pendingReview || 1) - 1)
  } catch (err) {
    showMsg(err.message || '操作失败', true)
  } finally {
    actionLoading.value = false
  }
}

async function warnUser(id) {
  actionLoading.value = true
  try {
    const res = await api.post(`/admin/users/${id}/warn`, { reason: '管理员警告' })
    showMsg(res.message)
    await loadUsers()
  } catch (err) {
    showMsg(err.message || '操作失败', true)
  } finally {
    actionLoading.value = false
  }
}

async function banUser(id) {
  actionLoading.value = true
  try {
    const res = await api.post(`/admin/users/${id}/ban`, { days: 7, reason: '违规行为' })
    showMsg(res.message)
    await loadUsers()
  } catch (err) {
    showMsg(err.message || '操作失败', true)
  } finally {
    actionLoading.value = false
  }
}

async function restoreUser(id) {
  actionLoading.value = true
  try {
    const res = await api.post(`/admin/users/${id}/restore`)
    showMsg(res.message)
    await loadUsers()
  } catch (err) {
    showMsg(err.message || '操作失败', true)
  } finally {
    actionLoading.value = false
  }
}

function showMsg(msg, isErr = false) {
  actionMsg.value = msg
  actionErr.value = isErr
  setTimeout(() => { actionMsg.value = '' }, 3000)
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

function creditClass(score) {
  if (score == null) return ''
  if (score >= 80) return 'credit-good'
  if (score >= 60) return 'credit-warn'
  return 'credit-danger'
}
</script>

<style scoped>
.admin-page {
  max-width: 640px;
  margin: 0 auto;
  padding: 16px;
  min-height: 100vh;
  background: #f5f5f5;
}

.admin-header h2 { margin: 0 0 12px; font-size: 1.2rem; }

.admin-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 16px;
}

.admin-tabs button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: #fff;
  font-size: .82rem;
  cursor: pointer;
  position: relative;
}
.admin-tabs button.active {
  background: #333;
  color: #fff;
  border-color: #333;
}

.tab-badge {
  position: absolute;
  top: -4px; right: -4px;
  background: #e53935;
  color: #fff;
  font-size: .65rem;
  width: 18px; height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.stat-num { display: block; font-size: 1.8rem; font-weight: 800; color: #333; }
.stat-label { font-size: .78rem; color: #999; }
.stat-card.warn .stat-num { color: #f39c12; }
.stat-card.danger .stat-num { color: #e53935; }

.loading-text, .empty-text {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: .9rem;
}

.review-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.rc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.rc-type {
  padding: 2px 10px;
  background: #f0f0f0;
  border-radius: 10px;
  font-size: .72rem;
  font-weight: 600;
}
.rc-time { font-size: .72rem; color: #999; }
.review-card h4 { margin: 4px 0; font-size: .95rem; }
.rc-desc { font-size: .82rem; color: #666; margin: 4px 0 8px; }
.rc-meta {
  display: flex;
  gap: 12px;
  font-size: .75rem;
  color: #888;
  margin-bottom: 8px;
}
.rc-reports {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}
.rc-report-item {
  display: flex;
  gap: 8px;
  font-size: .75rem;
  padding: 4px 8px;
  background: #fff5f5;
  border-radius: 6px;
}
.rc-reason { color: #e53935; font-weight: 600; }
.rc-detail { color: #666; }
.rc-actions { display: flex; gap: 8px; }

.btn-approve {
  flex: 1;
  padding: 10px;
  background: #00d4aa;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: .85rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-reject {
  flex: 1;
  padding: 10px;
  background: #e53935;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: .85rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-approve:disabled, .btn-reject:disabled { opacity: .5; }

.user-sort {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}
.user-sort button {
  padding: 6px 14px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background: #fff;
  font-size: .78rem;
  cursor: pointer;
}
.user-sort button.active { background: #333; color: #fff; border-color: #333; }

.user-card {
  background: #fff;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 8px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.uc-main {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}
.uc-main strong { font-size: .92rem; }
.uc-role {
  padding: 1px 8px;
  border-radius: 8px;
  font-size: .68rem;
  font-weight: 600;
}
.uc-role.admin { background: #e8f5e9; color: #2e7d32; }
.uc-role.user { background: #f0f0f0; color: #666; }
.uc-role.merchant { background: #e3f2fd; color: #1565c0; }

.uc-credit {
  padding: 1px 8px;
  border-radius: 8px;
  font-size: .72rem;
  font-weight: 700;
}
.credit-good { background: #e8f5e9; color: #2e7d32; }
.credit-warn { background: #fff3e0; color: #e65100; }
.credit-danger { background: #ffebee; color: #c62828; }

.uc-meta {
  display: flex;
  gap: 10px;
  font-size: .72rem;
  color: #888;
}
.uc-banned { color: #e53935; font-weight: 600; }

.uc-warnings {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}
.uc-warn-tag {
  padding: 2px 8px;
  background: #fff5f5;
  border-radius: 8px;
  font-size: .68rem;
  color: #e53935;
}

.uc-actions {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.btn-sm {
  padding: 5px 12px;
  border: none;
  border-radius: 10px;
  font-size: .75rem;
  cursor: pointer;
  font-weight: 600;
}
.btn-warn { background: #fff3e0; color: #e65100; }
.btn-ban { background: #ffebee; color: #c62828; }
.btn-restore { background: #e8f5e9; color: #2e7d32; }

.action-msg {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 24px;
  background: #333;
  color: #fff;
  border-radius: 20px;
  font-size: .85rem;
  z-index: 999;
  animation: fadeup .3s ease-out;
}
.action-err { background: #e53935; }

@keyframes fadeup {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
</style>
