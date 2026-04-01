<template>
  <div class="bot-chat">
    <!-- 浮动按钮 -->
    <button class="bot-fab" @click="toggleChat" :class="{ active: open }">
      🤖
    </button>

    <!-- 聊天面板 -->
    <transition name="slide">
      <div v-if="open" class="chat-panel">
        <div class="chat-header">
          <span>🤖 小突 AI助手</span>
          <button @click="open = false">×</button>
        </div>

        <div class="chat-messages" ref="messagesEl">
          <div
            v-for="(msg, i) in messages"
            :key="i"
            class="msg"
            :class="msg.role"
          >
            <div class="bubble">{{ msg.content }}</div>
          </div>
        </div>

        <div class="chat-input">
          <input
            v-model="input"
            @keyup.enter="sendMessage"
            placeholder="和小突聊聊..."
            :disabled="sending"
          />
          <button @click="sendMessage" :disabled="sending || !input.trim()">发送</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import api from '../../services/api.js'
import { useUserStore } from '../../stores/user.js'

const userStore = useUserStore()
const open = ref(false)
const input = ref('')
const sending = ref(false)
const messagesEl = ref(null)

const messages = ref([
  { role: 'assistant', content: '嗨！我是小突 🎯 你的寻宝AI伙伴！有什么我可以帮你的吗？' }
])

function toggleChat() {
  open.value = !open.value
}

async function sendMessage() {
  const text = input.value.trim()
  if (!text || sending.value) return

  messages.value.push({ role: 'user', content: text })
  input.value = ''
  sending.value = true
  scrollToBottom()

  try {
    const context = messages.value.slice(-6).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))

    const res = await api.post('/ai/chat', {
      message: text,
      context,
      username: userStore.username,
      userLevel: userStore.level
    })

    messages.value.push({
      role: 'assistant',
      content: res.reply || '抱歉，我没听清，再说一次？'
    })
  } catch {
    messages.value.push({
      role: 'assistant',
      content: '哎呀，网络不太好，等会再试试吧~ 😅'
    })
  } finally {
    sending.value = false
    scrollToBottom()
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}
</script>

<style scoped>
.bot-chat {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 400;
}

.bot-fab {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #00d4aa, #00b4d8);
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0,212,170,.4);
  transition: transform .2s;
}

.bot-fab:hover { transform: scale(1.1); }
.bot-fab.active { background: #555; }

.chat-panel {
  position: fixed;
  bottom: 80px;
  left: 20px;
  width: 320px;
  max-width: calc(100vw - 40px);
  height: 420px;
  max-height: 60vh;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0,0,0,.2);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #00d4aa, #00b4d8);
  color: #fff;
  font-weight: 600;
  font-size: .9rem;
}

.chat-header button {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.3rem;
  cursor: pointer;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.msg { display: flex; }
.msg.user { justify-content: flex-end; }
.msg.assistant { justify-content: flex-start; }

.bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 14px;
  font-size: .85rem;
  line-height: 1.5;
  word-break: break-word;
}

.msg.user .bubble {
  background: #00d4aa;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.msg.assistant .bubble {
  background: #f0f0f0;
  color: #333;
  border-bottom-left-radius: 4px;
}

.chat-input {
  display: flex;
  padding: 10px;
  gap: 8px;
  border-top: 1px solid #eee;
}

.chat-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: .85rem;
  outline: none;
}

.chat-input input:focus { border-color: #00d4aa; }

.chat-input button {
  padding: 8px 16px;
  background: #00d4aa;
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: .85rem;
  cursor: pointer;
}

.chat-input button:disabled { opacity: .5; }

.slide-enter-active, .slide-leave-active { transition: all .25s ease; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(20px) scale(.95); }
</style>
