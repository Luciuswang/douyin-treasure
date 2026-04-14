<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="detail-card">
      <button class="close-btn" @click="$emit('close')">×</button>

      <div class="header">
        <span class="type-icon">{{ typeIcons[treasure.type] || '📦' }}</span>
        <div>
          <h3>{{ treasure.title }}</h3>
          <span class="type-label">{{ typeLabels[treasure.type] || treasure.type }}</span>
        </div>
      </div>

      <p class="desc" v-if="treasure.description">{{ treasure.description }}</p>

      <div class="meta">
        <span>📍 {{ treasure.location?.address || '未知位置' }}</span>
        <span>👀 {{ treasure.stats?.views || 0 }} 次查看</span>
        <span>🎯 {{ treasure.stats?.discoveries || 0 }} 人发现</span>
      </div>

      <!-- 社交宝藏专属区域 -->
      <template v-if="treasure.type === 'social'">
        <div class="social-interests" v-if="treasure.content?.interests?.length">
          <span v-for="tag in treasure.content.interests" :key="tag" class="interest-tag">{{ tag }}</span>
        </div>

        <!-- 联系方式：仅匹配后可见 -->
        <div class="contact-area" v-if="treasure.isMatched && treasure.content?.contact">
          <div class="match-badge">💕 双向匹配成功！</div>
          <div class="contact-info">
            <span>联系方式：</span>
            <strong>{{ treasure.content.contact }}</strong>
          </div>
        </div>
        <div class="contact-locked" v-else-if="!isCreator">
          <span>🔒 双方都点"想认识"后可见联系方式</span>
        </div>

        <!-- 非创建者：想认识按钮 -->
        <div v-if="!isCreator" class="action-area">
          <button
            v-if="!treasure.isInterested && !treasure.isMatched"
            class="btn-interest"
            @click="handleInterest"
            :disabled="interestLoading"
          >{{ interestLoading ? '发送中...' : '💕 想认识' }}</button>
          <p v-else-if="treasure.isInterested && !treasure.isMatched" class="interest-sent">
            ✅ 已发送，等待对方回应
          </p>
        </div>

        <!-- 创建者：查看谁感兴趣 -->
        <div v-if="isCreator" class="interest-list-area">
          <button v-if="!showInterestList" class="btn-show-interests" @click="loadInterestList">
            💌 查看谁对你感兴趣 ({{ treasure.interestedBy?.length || treasure.interestCount || 0 }})
          </button>
          <div v-if="showInterestList" class="interest-list">
            <h4>对你感兴趣的人：</h4>
            <div v-if="!interestList.length" class="no-interests">还没有人表达兴趣</div>
            <div v-for="p in interestList" :key="p.userId" class="interest-person">
              <div class="person-info">
                <strong>{{ p.username }}</strong>
                <span class="person-level">Lv.{{ p.level }}</span>
                <p v-if="p.bio" class="person-bio">{{ p.bio }}</p>
                <div class="person-tags" v-if="p.interests?.length">
                  <span v-for="t in p.interests" :key="t" class="mini-tag">{{ t }}</span>
                </div>
              </div>
              <button
                v-if="!p.isMatched"
                class="btn-accept"
                @click="handleAccept(p.userId)"
                :disabled="acceptLoading"
              >也想认识</button>
              <span v-else class="matched-label">💕 已匹配</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 房屋租售专属区域 -->
      <template v-else-if="treasure.type === 'house'">
        <div class="house-card">
          <div class="house-badge-row">
            <span class="house-mode-badge" :class="houseInfo.mode">
              {{ houseInfo.mode === 'sell' ? '🏷️ 出售' : '🔑 出租' }}
            </span>
          </div>
          <div class="house-stats">
            <div class="house-stat" v-if="houseInfo.price">
              <span class="stat-value house-price">{{ houseInfo.price }}</span>
              <span class="stat-unit">{{ houseInfo.mode === 'rent' ? '元/月' : '万元' }}</span>
            </div>
            <div class="house-stat" v-if="houseInfo.area">
              <span class="stat-value">{{ houseInfo.area }}</span>
              <span class="stat-unit">㎡</span>
            </div>
            <div class="house-stat" v-if="houseInfo.layout">
              <span class="stat-value">{{ houseInfo.layout }}</span>
            </div>
            <div class="house-stat" v-if="houseInfo.floor">
              <span class="stat-value">{{ houseInfo.floor }}</span>
              <span class="stat-unit">层</span>
            </div>
          </div>
          <div class="house-features" v-if="houseInfo.features?.length">
            <span v-for="f in houseInfo.features" :key="f" class="house-feature-tag">{{ f }}</span>
          </div>
          <div class="house-contact" v-if="treasure.isDiscovered && houseInfo.contact">
            <span>📞 联系方式：</span>
            <strong>{{ houseInfo.contact }}</strong>
          </div>
          <div class="house-contact-locked" v-else-if="!treasure.isDiscovered">
            <span>🔒 到达现场后可查看联系方式</span>
          </div>
        </div>

        <div v-if="treasure.isDiscovered" class="discovered-badge">
          ✅ 你已经发现了这个房源
        </div>
        <div v-else class="action-area">
          <p class="safety-tip">建议带人同行看房，注意安全</p>
          <button class="btn-discover btn-house" @click="handleDiscover" :disabled="discovering">
            {{ discovering ? '查看中...' : '🏠 到达现场查看' }}
          </button>
          <p class="hint">需要到达 {{ treasure.location?.discoveryRadius || 50 }}m 范围内</p>
        </div>
      </template>

      <!-- 普通宝藏区域 -->
      <template v-else>
        <div class="content-preview" v-if="treasure.content?.text">
          <p>{{ treasure.isDiscovered ? treasure.content.text : '到达指定地点后解锁内容...' }}</p>
        </div>

        <div class="rewards" v-if="treasure.rewards">
          <span>🏆 +{{ treasure.rewards.experience || 10 }} 经验</span>
          <span>🪙 +{{ treasure.rewards.coins || 5 }} 金币</span>
        </div>

        <div v-if="treasure.isDiscovered" class="discovered-badge">
          ✅ 你已经发现了这个宝藏
        </div>

        <div v-else class="action-area">
          <p class="safety-tip">请注意周围环境安全，切勿进入危险区域</p>
          <div v-if="treasure.password" class="password-input">
            <input v-model="password" type="text" placeholder="输入宝藏密码" />
          </div>
          <button class="btn-discover" @click="handleDiscover" :disabled="discovering">
            {{ discovering ? '发现中...' : '🎯 发现宝藏' }}
          </button>
          <p class="hint">需要到达宝藏 {{ treasure.location?.discoveryRadius || 50 }}m 范围内</p>
        </div>
      </template>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      <p v-if="successMsg" class="success">{{ successMsg }}</p>

      <!-- 举报区域 -->
      <div class="report-area">
        <button v-if="!showReportPanel" class="report-toggle" @click="showReportPanel = true">
          🚩 举报此宝藏
        </button>
        <div v-if="showReportPanel" class="report-panel">
          <p class="report-title">选择举报原因：</p>
          <div class="report-options">
            <button
              v-for="r in reportReasons" :key="r.value"
              class="report-reason-btn"
              :class="{ active: selectedReason === r.value }"
              @click="selectedReason = r.value"
            >{{ r.label }}</button>
          </div>
          <div class="report-actions">
            <button class="btn-report-submit" @click="handleReport" :disabled="reporting || !selectedReason">
              {{ reporting ? '提交中...' : '提交举报' }}
            </button>
            <button class="btn-report-cancel" @click="showReportPanel = false; selectedReason = ''">取消</button>
          </div>
          <p v-if="reportMsg" class="report-msg">{{ reportMsg }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useMapStore } from '../../stores/map.js'
import { useTreasureStore } from '../../stores/treasure.js'
import { useUserStore } from '../../stores/user.js'

const props = defineProps({ treasure: Object })
const emit = defineEmits(['close', 'discovered'])

const mapStore = useMapStore()
const treasureStore = useTreasureStore()
const userStore = useUserStore()

const password = ref('')
const discovering = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const showReportPanel = ref(false)
const selectedReason = ref('')
const reporting = ref(false)
const reportMsg = ref('')

// 社交宝藏状态
const interestLoading = ref(false)
const acceptLoading = ref(false)
const showInterestList = ref(false)
const interestList = ref([])

const isCreator = computed(() => {
  if (!userStore.user?._id) return false
  const creatorId = props.treasure.creator?._id || props.treasure.creator
  return creatorId?.toString() === userStore.user._id.toString()
})

const reportReasons = [
  { value: 'dangerous_location', label: '⚠️ 位置危险' },
  { value: 'inappropriate_content', label: '🚫 不当内容' },
  { value: 'spam', label: '📢 垃圾信息' },
  { value: 'other', label: '❓ 其他' }
]

const typeIcons = {
  note: '📝', coupon: '🎫', ticket: '🎬', job: '💼',
  event: '🎉', redpacket: '🧧', task: '📋', image: '🖼️', custom: '📦', social: '💕', house: '🏠'
}
const typeLabels = {
  note: '笔记', coupon: '优惠券', ticket: '门票', job: '招聘',
  event: '活动', redpacket: '红包', task: '任务', image: '图片', custom: '自定义', social: '缘分宝藏', house: '房屋信息'
}

const houseInfo = computed(() => props.treasure.content?.extra || {})

async function handleInterest() {
  if (!userStore.isLoggedIn) {
    window.__totofun_openAuth?.()
    return
  }
  interestLoading.value = true
  errorMsg.value = ''
  try {
    const res = await treasureStore.expressInterest(props.treasure._id)
    successMsg.value = res.message || '已发送！'
    props.treasure.isInterested = true
  } catch (err) {
    errorMsg.value = err.message || '操作失败'
  } finally {
    interestLoading.value = false
  }
}

async function loadInterestList() {
  showInterestList.value = true
  try {
    const res = await treasureStore.getInterests(props.treasure._id)
    interestList.value = res.data || []
  } catch (err) {
    errorMsg.value = err.message || '加载失败'
  }
}

async function handleAccept(userId) {
  acceptLoading.value = true
  errorMsg.value = ''
  try {
    const res = await treasureStore.acceptInterest(props.treasure._id, userId)
    successMsg.value = res.message || '匹配成功！'
    const person = interestList.value.find(p => p.userId === userId)
    if (person) person.isMatched = true
  } catch (err) {
    errorMsg.value = err.message || '操作失败'
  } finally {
    acceptLoading.value = false
  }
}

async function handleReport() {
  if (!userStore.isLoggedIn) {
    window.__totofun_openAuth?.()
    return
  }
  if (!selectedReason.value) return

  reporting.value = true
  reportMsg.value = ''
  try {
    const res = await treasureStore.reportTreasure(props.treasure._id, selectedReason.value)
    reportMsg.value = res.message || '举报已提交'
    setTimeout(() => { showReportPanel.value = false }, 2000)
  } catch (err) {
    reportMsg.value = err.message || '举报失败'
  } finally {
    reporting.value = false
  }
}

async function handleDiscover() {
  if (!userStore.isLoggedIn) {
    window.__totofun_openAuth?.()
    return
  }

  if (!mapStore.userLocation) {
    errorMsg.value = '请先开启定位'
    return
  }

  discovering.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    const { lat, lng } = mapStore.userLocation
    const res = await treasureStore.discoverTreasure(
      props.treasure._id, lat, lng, password.value || undefined
    )
    if (res.success) {
      successMsg.value = `🎉 ${res.message || '恭喜发现宝藏！'}`
      if (res.data?.levelUp) {
        successMsg.value += ` 升级到 Lv.${res.data.newLevel}！`
      }
      setTimeout(() => emit('discovered'), 2000)
    }
  } catch (err) {
    errorMsg.value = err.message || '发现失败'
  } finally {
    discovering.value = false
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 500;
}

.detail-card {
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 24px 20px 32px;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.type-icon { font-size: 2.5rem; }
.header h3 { margin: 0; font-size: 1.1rem; color: #333; }
.type-label { font-size: .75rem; color: #999; }

.desc { color: #555; font-size: .9rem; line-height: 1.5; }

.meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: .78rem;
  color: #888;
  margin: 10px 0;
}

.content-preview {
  background: #f5f5f5;
  border-radius: 10px;
  padding: 14px;
  margin: 10px 0;
  font-size: .9rem;
  color: #555;
}

.rewards {
  display: flex;
  gap: 16px;
  font-size: .85rem;
  color: #ff8c00;
  margin: 8px 0;
}

.discovered-badge {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 12px;
  border-radius: 10px;
  text-align: center;
  font-weight: 600;
  margin-top: 12px;
}

.action-area { margin-top: 14px; }

.password-input input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: .9rem;
  margin-bottom: 10px;
  box-sizing: border-box;
}

.btn-discover {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #00d4aa, #00b4d8);
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-discover:disabled { opacity: .6; cursor: not-allowed; }

.hint { text-align: center; font-size: .75rem; color: #999; margin-top: 8px; }

.safety-tip {
  background: #fff3e0;
  color: #e65100;
  font-size: .75rem;
  padding: 8px 12px;
  border-radius: 8px;
  text-align: center;
  margin-bottom: 10px;
}

.error { color: #e53935; font-size: .85rem; text-align: center; margin-top: 8px; }
.success { color: #2e7d32; font-size: .85rem; text-align: center; margin-top: 8px; }

.report-area {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.report-toggle {
  background: none;
  border: none;
  color: #999;
  font-size: .78rem;
  cursor: pointer;
  padding: 4px 0;
}

.report-toggle:hover { color: #e53935; }

.report-panel { margin-top: 8px; }

.report-title { font-size: .85rem; color: #555; margin: 0 0 8px; }

.report-options { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }

.report-reason-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 16px;
  background: #f9f9f9;
  font-size: .78rem;
  cursor: pointer;
  transition: all .15s;
}

.report-reason-btn.active {
  background: #e53935;
  color: #fff;
  border-color: #e53935;
}

.report-actions { display: flex; gap: 8px; }

.btn-report-submit {
  flex: 1;
  padding: 10px;
  background: #e53935;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: .85rem;
  cursor: pointer;
}

.btn-report-submit:disabled { opacity: .5; cursor: not-allowed; }

.btn-report-cancel {
  padding: 10px 16px;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 20px;
  font-size: .85rem;
  cursor: pointer;
}

.report-msg { font-size: .8rem; color: #e65100; text-align: center; margin-top: 6px; }

/* 社交宝藏样式 */
.social-interests { display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; }

.interest-tag {
  padding: 4px 10px;
  background: linear-gradient(135deg, #fff0f6, #f3e8ff);
  border: 1px solid #f0d0e8;
  border-radius: 12px;
  font-size: .78rem;
  color: #9c27b0;
}

.contact-area { margin: 12px 0; }

.match-badge {
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  color: #fff;
  padding: 12px;
  border-radius: 10px;
  text-align: center;
  font-weight: 700;
  margin-bottom: 8px;
}

.contact-info {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 10px;
  font-size: .9rem;
}

.contact-info strong { color: #333; }

.contact-locked {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 10px;
  text-align: center;
  font-size: .8rem;
  color: #999;
  margin: 10px 0;
}

.btn-interest {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-interest:disabled { opacity: .6; }

.interest-sent {
  text-align: center;
  color: #9c27b0;
  font-size: .85rem;
  padding: 10px;
  background: #f3e8ff;
  border-radius: 10px;
}

.interest-list-area { margin-top: 12px; }

.btn-show-interests {
  width: 100%;
  padding: 12px;
  background: #f3e8ff;
  color: #7b1fa2;
  border: 1px solid #e1bee7;
  border-radius: 12px;
  font-size: .9rem;
  cursor: pointer;
}

.interest-list h4 { font-size: .9rem; color: #555; margin: 12px 0 8px; }

.no-interests { color: #999; font-size: .85rem; text-align: center; padding: 16px; }

.interest-person {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 10px;
  margin-bottom: 8px;
}

.person-info { flex: 1; min-width: 0; }

.person-info strong { font-size: .9rem; color: #333; }

.person-level { font-size: .72rem; color: #999; margin-left: 6px; }

.person-bio { font-size: .78rem; color: #666; margin: 4px 0 0; }

.person-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }

.mini-tag {
  padding: 2px 6px;
  background: #f3e8ff;
  border-radius: 8px;
  font-size: .68rem;
  color: #9c27b0;
}

.btn-accept {
  padding: 8px 16px;
  background: linear-gradient(135deg, #ff6b9d, #c084fc);
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: .78rem;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 8px;
}

.btn-accept:disabled { opacity: .5; }

.matched-label { color: #9c27b0; font-size: .78rem; font-weight: 600; flex-shrink: 0; margin-left: 8px; }

/* 房屋租售样式 */
.house-card {
  background: linear-gradient(135deg, #fff8f0, #fff);
  border: 1px solid #f0d4a8;
  border-radius: 12px;
  padding: 16px;
  margin: 10px 0;
}

.house-badge-row { margin-bottom: 10px; }

.house-mode-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: .82rem;
  font-weight: 700;
}

.house-mode-badge.rent {
  background: #e8f5e9;
  color: #2e7d32;
}

.house-mode-badge.sell {
  background: #fff3e0;
  color: #e65100;
}

.house-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.house-stat {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
}

.house-price {
  font-size: 1.4rem;
  color: #e67e22;
}

.stat-unit {
  font-size: .75rem;
  color: #999;
}

.house-features {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}

.house-feature-tag {
  padding: 3px 8px;
  background: #fff0e0;
  border: 1px solid #f0d4a8;
  border-radius: 10px;
  font-size: .72rem;
  color: #e67e22;
}

.house-contact {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 10px;
  font-size: .9rem;
  margin-top: 8px;
}

.house-contact strong { color: #e67e22; }

.house-contact-locked {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 10px;
  text-align: center;
  font-size: .8rem;
  color: #999;
  margin-top: 8px;
}

.btn-house {
  background: linear-gradient(135deg, #e67e22, #f39c12) !important;
}
</style>
