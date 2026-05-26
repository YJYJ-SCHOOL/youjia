<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../stores/index.js'

const router = useRouter()
const phone = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

function handleLogin() {
  error.value = ''
  if (!phone.value || !password.value) {
    error.value = '请输入手机号和密码'
    return
  }
  loading.value = true
  // 模拟延迟
  setTimeout(() => {
    const user = login(phone.value, password.value)
    loading.value = false
    if (user) {
      router.push('/')
    } else {
      error.value = '手机号或密码错误'
    }
  }, 500)
}

// 快速登录按钮
function quickLogin(role) {
  const accounts = {
    admin: { phone: '13800000001', password: '123456' },
    teacher: { phone: '13800000002', password: '123456' },
    parent: { phone: '13800000004', password: '123456' },
  }
  phone.value = accounts[role].phone
  password.value = accounts[role].password
  handleLogin()
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-300 via-orange-300 to-rose-300 p-4">
    <!-- 装饰元素 -->
    <div class="absolute top-10 left-10 text-6xl opacity-30 select-none">☀️</div>
    <div class="absolute bottom-20 right-16 text-5xl opacity-20 select-none">🌈</div>
    <div class="absolute top-32 right-32 text-4xl opacity-25 select-none">⭐</div>
    <div class="absolute bottom-32 left-24 text-5xl opacity-20 select-none">🎒</div>

    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="text-7xl mb-3 drop-shadow-lg">☀️</div>
        <h1 class="text-3xl font-extrabold text-white drop-shadow-md tracking-wide">优家优漖成长中心</h1>
        <p class="text-white/80 mt-2 text-sm">小学托管教育管理系统</p>
      </div>

      <!-- 登录卡片 -->
      <div class="bg-white/90 backdrop-blur rounded-3xl shadow-2xl p-8">
        <h2 class="text-xl font-bold text-gray-800 mb-6 text-center">登录</h2>

        <div v-if="error" class="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl px-4 py-3 mb-4 text-sm">
          {{ error }}
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">手机号</label>
            <input
              v-model="phone"
              type="text"
              placeholder="请输入手机号"
              class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 outline-none transition-colors text-gray-700"
              @keyup.enter="handleLogin"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">密码</label>
            <input
              v-model="password"
              type="password"
              placeholder="请输入密码"
              class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-400 outline-none transition-colors text-gray-700"
              @keyup.enter="handleLogin"
            />
          </div>
        </div>

        <button
          @click="handleLogin"
          :disabled="loading"
          class="w-full mt-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl hover:from-amber-500 hover:to-orange-600 transition-all shadow-lg shadow-amber-400/30 active:scale-95 disabled:opacity-60"
        >
          {{ loading ? '登录中...' : '登  录' }}
        </button>

        <div class="mt-6 pt-4 border-t border-gray-100">
          <p class="text-xs text-gray-400 text-center mb-3">快速体验（点击直接登录）</p>
          <div class="grid grid-cols-3 gap-2">
            <button @click="quickLogin('admin')" class="py-2 px-3 bg-amber-50 hover:bg-amber-100 rounded-xl text-xs text-amber-700 font-medium transition-colors border border-amber-200">
              👤 管理员
            </button>
            <button @click="quickLogin('teacher')" class="py-2 px-3 bg-sky-50 hover:bg-sky-100 rounded-xl text-xs text-sky-700 font-medium transition-colors border border-sky-200">
              👩‍🏫 老师
            </button>
            <button @click="quickLogin('parent')" class="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-xs text-emerald-700 font-medium transition-colors border border-emerald-200">
              👪 家长
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
