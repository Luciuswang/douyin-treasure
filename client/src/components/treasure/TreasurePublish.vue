<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="publish-card">
      <div class="pub-header">
        <h3>📤 发布宝藏</h3>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="form">
        <div class="type-selector">
          <button
            v-for="t in types" :key="t.value"
            class="type-btn"
            :class="{ active: form.type === t.value }"
            @click="form.type = t.value"
          >
            {{ t.icon }} {{ t.label }}
          </button>
        </div>

        <input v-model="form.title" placeholder="宝藏标题 *" maxlength="100" />
        <textarea v-model="form.description" placeholder="描述一下这个宝藏..." maxlength="500" rows="3"></textarea>

        <div class="content-fields">
          <input v-if="showTextField" v-model="form.content.text" :placeholder="textPlaceholder" />
          <input v-if="form.type === 'coupon'" v-model="form.content.couponCode" placeholder="优惠码（可选）" />
          <input v-if="form.type === 'redpacket'" v-model.number="form.content.amount" type="number" placeholder="金额" />
          <input v-if="form.type === 'link' || form.type === 'event'" v-model="form.content.link" placeholder="链接（可选）" />
        </div>

        <input v-model="form.password" placeholder="设置密码（可选，需要密码才能领取）" />

        <div class="location-info">
          <span v-if="mapStore.userLocation">
            📍 使用当前位置 ({{ mapStore.userLocation.lat.toFixed(5) }}, {{ mapStore.userLocation.lng.toFixed(5) }})
          </span>
          <span v-else>⚠️ 请先定位</span>
        </div>

        <div class="radius-field">
          <label>发现范围: {{ form.discoveryRadius }}m</label>
          <input type="range" v-model.number="form.discoveryRadius" min="10" max="500" step="10" />
        </div>

        <select v-model="form.category">
          <option value="">选择分类</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>

        <p class="safety-notice">发布即表示您确认此位置安全可达</p>
        <button class="btn-publish" @click="handlePublish" :disabled="publishing">
          {{ publishing ? (safetyChecking ? '安全检测中...' : '发布中...') : '✨ 发布宝藏' }}
        </button>
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useMapStore } from '../../stores/map.js'
import { useTreasureStore } from '../../stores/treasure.js'
import { useUserStore } from '../../stores/user.js'
import { checkLocationSafety } from '../../services/amap.js'

const emit = defineEmits(['close', 'published'])
const mapStore = useMapStore()
const treasureStore = useTreasureStore()
const userStore = useUserStore()

const publishing = ref(false)
const safetyChecking = ref(false)
const errorMsg = ref('')

const form = reactive({
  title: '',
  description: '',
  type: 'note',
  content: { text: '', couponCode: '', amount: 0, link: '' },
  password: '',
  discoveryRadius: 50,
  category: '其他'
})

const types = [
  { value: 'note', icon: '📝', label: '笔记' },
  { value: 'coupon', icon: '🎫', label: '优惠券' },
  { value: 'redpacket', icon: '🧧', label: '红包' },
  { value: 'ticket', icon: '🎬', label: '门票' },
  { value: 'job', icon: '💼', label: '招聘' },
  { value: 'event', icon: '🎉', label: '活动' },
  { value: 'task', icon: '📋', label: '任务' },
  { value: 'custom', icon: '📦', label: '自定义' }
]

const categories = ['美食', '旅游', '摄影', '运动', '音乐', '艺术', '历史', '购物', '咖啡', '酒吧', '电影', '其他']

const showTextField = computed(() => ['note', 'coupon', 'ticket', 'job', 'event', 'task', 'custom'].includes(form.type))

const textPlaceholder = computed(() => {
  const map = {
    note: '写点什么...', coupon: '优惠详情', ticket: '门票信息',
    job: '职位描述', event: '活动详情', task: '任务说明', custom: '自定义内容'
  }
  return map[form.type] || '内容'
})

async function handlePublish() {
  if (!userStore.isLoggedIn) {
    window.__totofun_openAuth?.()
    return
  }
  if (!form.title.trim()) {
    errorMsg.value = '请输入标题'
    return
  }
  if (!mapStore.userLocation) {
    errorMsg.value = '请先开启定位'
    return
  }

  publishing.value = true
  errorMsg.value = ''

  try {
    const { lat, lng } = mapStore.userLocation

    // 安全检测
    safetyChecking.value = true
    const safety = await checkLocationSafety(lng, lat)
    safetyChecking.value = false
    if (!safety.safe) {
      errorMsg.value = `${safety.detail || '该位置可能存在安全风险'}，请换个位置发布`
      publishing.value = false
      return
    }

    const res = await treasureStore.createTreasure({
      title: form.title,
      description: form.description,
      type: form.type,
      content: form.content,
      password: form.password || undefined,
      location: {
        coordinates: [lng, lat],
        discoveryRadius: form.discoveryRadius
      },
      category: form.category || '其他'
    })
    if (res.success) emit('published')
  } catch (err) {
    errorMsg.value = err.message || '发布失败'
  } finally {
    publishing.value = false
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

.publish-card {
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 20px;
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
}

.pub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.pub-header h3 { margin: 0; font-size: 1.1rem; }

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
}

.form { display: flex; flex-direction: column; gap: 12px; }

.type-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type-btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  background: #f9f9f9;
  font-size: .8rem;
  cursor: pointer;
  transition: all .15s;
}

.type-btn.active {
  background: #00d4aa;
  color: #fff;
  border-color: #00d4aa;
}

input, textarea, select {
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: .9rem;
  width: 100%;
  box-sizing: border-box;
}

textarea { resize: vertical; }

.content-fields { display: flex; flex-direction: column; gap: 8px; }

.location-info { font-size: .8rem; color: #666; }

.radius-field label { font-size: .85rem; color: #555; }
.radius-field input[type="range"] { width: 100%; border: none; padding: 0; }

.btn-publish {
  padding: 14px;
  background: linear-gradient(135deg, #00d4aa, #00b4d8);
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-publish:disabled { opacity: .6; }

.safety-notice {
  font-size: .75rem;
  color: #999;
  text-align: center;
  margin: 0;
}

.error { color: #e53935; font-size: .85rem; text-align: center; }
</style>
