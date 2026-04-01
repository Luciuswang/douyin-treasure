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
        <div v-if="treasure.password" class="password-input">
          <input v-model="password" type="text" placeholder="输入宝藏密码" />
        </div>
        <button class="btn-discover" @click="handleDiscover" :disabled="discovering">
          {{ discovering ? '发现中...' : '🎯 发现宝藏' }}
        </button>
        <p class="hint">需要到达宝藏 {{ treasure.location?.discoveryRadius || 50 }}m 范围内</p>
      </div>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      <p v-if="successMsg" class="success">{{ successMsg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
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

const typeIcons = {
  note: '📝', coupon: '🎫', ticket: '🎬', job: '💼',
  event: '🎉', redpacket: '🧧', task: '📋', image: '🖼️', custom: '📦'
}
const typeLabels = {
  note: '笔记', coupon: '优惠券', ticket: '门票', job: '招聘',
  event: '活动', redpacket: '红包', task: '任务', image: '图片', custom: '自定义'
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

.error { color: #e53935; font-size: .85rem; text-align: center; margin-top: 8px; }
.success { color: #2e7d32; font-size: .85rem; text-align: center; margin-top: 8px; }
</style>
