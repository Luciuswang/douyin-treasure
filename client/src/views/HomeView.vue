<template>
  <div class="home">
    <section class="hero">
      <img :src="logoUrl" alt="Totofun" class="logo" @error="e => e.target.style.display='none'" />
      <h1 class="title">Totofun <span>突突翻</span></h1>
      <p class="subtitle">基于GPS的实时寻宝游戏 — 探索身边的宝藏</p>

      <div class="stats-bar">
        <div class="stat">
          <span class="stat-value">{{ userStore.username }}</span>
          <span class="stat-label">玩家</span>
        </div>
        <div class="stat">
          <span class="stat-value">Lv.{{ userStore.level }}</span>
          <span class="stat-label">等级</span>
        </div>
        <div class="stat">
          <span class="stat-value">{{ treasuresFound }}</span>
          <span class="stat-label">已发现</span>
        </div>
      </div>

      <button class="btn-start" @click="startGame">
        🚀 启动寻宝之旅
      </button>

      <button v-if="!userStore.isLoggedIn" class="btn-login" @click="openAuth">
        🔐 登录 / 注册
      </button>
    </section>

    <section class="features">
      <div class="feature-card" v-for="f in features" :key="f.icon">
        <span class="feature-icon">{{ f.icon }}</span>
        <h3>{{ f.title }}</h3>
        <p>{{ f.desc }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user.js'

const router = useRouter()
const userStore = useUserStore()
const logoUrl = '/totofun-logo.png'

const treasuresFound = computed(() => userStore.user?.stats?.treasuresDiscovered || 0)

const features = [
  { icon: '🗺️', title: '地图寻宝', desc: '在真实世界中发现隐藏的宝藏' },
  { icon: '🎁', title: '惊喜奖励', desc: '优惠券、红包、活动门票等你来拿' },
  { icon: '👥', title: '社交互动', desc: '和好友一起寻宝，分享乐趣' },
  { icon: '🤖', title: 'AI伙伴', desc: '智能助手小突陪你探索世界' }
]

function startGame() {
  router.push('/map')
}

function openAuth() {
  window.__totofun_openAuth?.()
}
</script>

<style scoped>
.home {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.hero {
  text-align: center;
  padding: 40px 20px 30px;
  max-width: 480px;
  width: 100%;
}

.logo {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  margin-bottom: 16px;
}

.title {
  font-size: 2rem;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0,0,0,.3);
  margin: 0 0 8px;
}

.title span {
  display: block;
  font-size: 1rem;
  opacity: .8;
  font-weight: 400;
}

.subtitle {
  color: rgba(255,255,255,.85);
  font-size: .9rem;
  margin-bottom: 24px;
}

.stats-bar {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 28px;
  background: rgba(255,255,255,.15);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
}

.stat-label {
  font-size: .75rem;
  color: rgba(255,255,255,.7);
  margin-top: 2px;
}

.btn-start {
  display: block;
  width: 100%;
  max-width: 320px;
  margin: 0 auto 12px;
  padding: 16px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  border: none;
  border-radius: 50px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(255,107,107,.4);
  transition: transform .15s, box-shadow .15s;
}

.btn-start:active { transform: scale(.97); }

.btn-login {
  display: inline-block;
  margin-top: 8px;
  padding: 10px 28px;
  font-size: .9rem;
  color: #fff;
  background: rgba(255,255,255,.2);
  border: 1px solid rgba(255,255,255,.3);
  border-radius: 50px;
  cursor: pointer;
  backdrop-filter: blur(5px);
}

.features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  max-width: 480px;
  width: 100%;
  padding: 10px 0 40px;
}

.feature-card {
  background: rgba(255,255,255,.12);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px 16px;
  text-align: center;
  border: 1px solid rgba(255,255,255,.15);
}

.feature-icon { font-size: 2rem; }
.feature-card h3 { color: #fff; font-size: .95rem; margin: 8px 0 4px; }
.feature-card p { color: rgba(255,255,255,.7); font-size: .78rem; margin: 0; line-height: 1.4; }
</style>
