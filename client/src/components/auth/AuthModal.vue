<template>
  <div class="overlay" @click.self="$emit('close')">
    <div class="auth-card">
      <button class="close-btn" @click="$emit('close')">×</button>

      <div class="tabs">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">登录</button>
        <button :class="{ active: mode === 'register' }" @click="mode = 'register'">注册</button>
      </div>

      <form @submit.prevent="handleSubmit" class="form">
        <input
          v-if="mode === 'register'"
          v-model="username"
          type="text"
          placeholder="用户名"
          required
          minlength="3"
          maxlength="20"
        />
        <input v-model="email" type="email" placeholder="邮箱" required />
        <input v-model="password" type="password" placeholder="密码" required minlength="6" />

        <button type="submit" class="btn-submit" :disabled="loading">
          {{ loading ? '请稍候...' : (mode === 'login' ? '登录' : '注册') }}
        </button>
      </form>

      <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
      <p v-if="successMsg" class="success">{{ successMsg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useUserStore } from '../../stores/user.js'

const emit = defineEmits(['close'])
const userStore = useUserStore()

const mode = ref('login')
const username = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

async function handleSubmit() {
  loading.value = true
  errorMsg.value = ''
  successMsg.value = ''

  try {
    if (mode.value === 'login') {
      const res = await userStore.login(email.value, password.value)
      if (res.success) {
        successMsg.value = '登录成功！'
        setTimeout(() => emit('close'), 800)
      } else {
        errorMsg.value = res.message || '登录失败'
      }
    } else {
      const res = await userStore.register(username.value, email.value, password.value)
      if (res.success) {
        successMsg.value = '注册成功，请登录'
        mode.value = 'login'
      } else {
        errorMsg.value = res.message || '注册失败'
      }
    }
  } catch (err) {
    errorMsg.value = err.message || '网络错误'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.5);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 600;
}

.auth-card {
  background: #fff;
  border-radius: 20px;
  padding: 30px 24px;
  width: 90%;
  max-width: 380px;
  position: relative;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 14px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
}

.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-bottom: 2px solid #eee;
}

.tabs button {
  flex: 1;
  padding: 10px;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  color: #999;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color .2s;
}

.tabs button.active {
  color: #00d4aa;
  border-bottom-color: #00d4aa;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form input {
  padding: 12px 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: .95rem;
  width: 100%;
  box-sizing: border-box;
}

.form input:focus { outline: none; border-color: #00d4aa; }

.btn-submit {
  padding: 14px;
  background: linear-gradient(135deg, #00d4aa, #00b4d8);
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
}

.btn-submit:disabled { opacity: .6; }

.error { color: #e53935; font-size: .85rem; text-align: center; margin-top: 8px; }
.success { color: #2e7d32; font-size: .85rem; text-align: center; margin-top: 8px; }
</style>
