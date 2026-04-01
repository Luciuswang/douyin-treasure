<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="avatar">{{ userStore.username?.charAt(0)?.toUpperCase() || '?' }}</div>
      <h2>{{ userStore.username }}</h2>
      <span class="level-badge">Lv.{{ userStore.level }}</span>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="num">{{ user?.stats?.treasuresCreated || 0 }}</span>
        <span class="label">发布宝藏</span>
      </div>
      <div class="stat-card">
        <span class="num">{{ user?.stats?.treasuresDiscovered || 0 }}</span>
        <span class="label">发现宝藏</span>
      </div>
      <div class="stat-card">
        <span class="num">{{ user?.level?.experience || 0 }}</span>
        <span class="label">经验值</span>
      </div>
      <div class="stat-card">
        <span class="num">{{ user?.level?.badges?.length || 0 }}</span>
        <span class="label">徽章</span>
      </div>
    </div>

    <div class="section">
      <h3>我发布的宝藏</h3>
      <div v-if="myTreasures.length === 0" class="empty">还没有发布过宝藏</div>
      <div v-for="t in myTreasures" :key="t._id" class="treasure-item">
        <span class="type-icon">{{ typeIcons[t.type] || '📦' }}</span>
        <div class="info">
          <strong>{{ t.title }}</strong>
          <small>{{ t.type }} · 被发现 {{ t.stats?.discoveries || 0 }} 次</small>
        </div>
      </div>
    </div>

    <button class="btn-logout" @click="handleLogout">退出登录</button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'
import { useTreasureStore } from '../stores/treasure.js'

const router = useRouter()
const userStore = useUserStore()
const treasureStore = useTreasureStore()

const user = computed(() => userStore.user)
const myTreasures = computed(() => treasureStore.myTreasures)

const typeIcons = {
  note: '📝', coupon: '🎫', ticket: '🎬', job: '💼',
  event: '🎉', redpacket: '🧧', task: '📋', image: '🖼️', custom: '📦'
}

onMounted(() => {
  userStore.fetchMe()
  treasureStore.loadMy()
})

async function handleLogout() {
  await userStore.logout()
  router.push('/')
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: 20px;
  max-width: 480px;
  margin: 0 auto;
}

.profile-header {
  text-align: center;
  padding: 30px 0 20px;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00d4aa, #00b4d8);
  color: #fff;
  font-size: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
}

.profile-header h2 { color: #fff; margin: 0 0 4px; }

.level-badge {
  display: inline-block;
  padding: 2px 12px;
  background: rgba(255,255,255,.2);
  border-radius: 20px;
  color: #fff;
  font-size: .8rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 24px;
}

.stat-card {
  background: rgba(255,255,255,.12);
  border-radius: 12px;
  padding: 14px 8px;
  text-align: center;
  backdrop-filter: blur(8px);
}

.stat-card .num { display: block; font-size: 1.3rem; font-weight: 700; color: #fff; }
.stat-card .label { font-size: .7rem; color: rgba(255,255,255,.6); }

.section { margin-bottom: 24px; }
.section h3 { color: #fff; font-size: 1rem; margin-bottom: 12px; }

.empty {
  color: rgba(255,255,255,.5);
  text-align: center;
  padding: 20px;
  font-size: .9rem;
}

.treasure-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,.1);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
}

.type-icon { font-size: 1.5rem; }
.info strong { color: #fff; display: block; font-size: .9rem; }
.info small { color: rgba(255,255,255,.6); font-size: .75rem; }

.btn-logout {
  display: block;
  width: 100%;
  padding: 14px;
  margin-top: 20px;
  background: rgba(255,100,100,.3);
  border: 1px solid rgba(255,100,100,.4);
  border-radius: 12px;
  color: #fff;
  font-size: .95rem;
  cursor: pointer;
}
</style>
