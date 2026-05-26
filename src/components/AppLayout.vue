<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getCurrentUser, logout } from '../stores/index.js'

const router = useRouter()
const route = useRoute()
const user = computed(() => getCurrentUser())
const sidebarOpen = ref(true)

const menuItems = computed(() => {
  const items = [
    { path: '/', label: '仪表盘', icon: '📊', roles: ['admin', 'teacher', 'parent'] },
  ]
  if (user.value?.role === 'admin' || user.value?.role === 'teacher') {
    items.push({ path: '/students', label: '学生管理', icon: '👦', roles: ['admin', 'teacher'] })
  }
  if (user.value?.role === 'admin') {
    items.push({ path: '/fees', label: '费用管理', icon: '💰', roles: ['admin'] })
    items.push({ path: '/fees/alerts', label: '费用预警', icon: '🚨', roles: ['admin'] })
  }
  if (user.value?.role === 'admin' || user.value?.role === 'teacher') {
    items.push({ path: '/feedback', label: '反馈管理', icon: '📝', roles: ['admin', 'teacher'] })
  }
  if (user.value?.role === 'admin' || user.value?.role === 'teacher') {
    items.push({ path: '/leaves', label: '请假管理', icon: '📋', roles: ['admin', 'teacher'] })
  }
  if (user.value?.role === 'admin') {
    items.push({ path: '/settings', label: '系统设置', icon: '⚙️', roles: ['admin'] })
  }
  return items
})

const titles = {
  '/': '仪表盘',
  '/students': '学生管理',
  '/fees': '费用管理',
  '/fees/alerts': '费用预警',
  '/feedback': '学生阶段反馈',
  '/leaves': '请假管理',
  '/settings': '系统设置',
}

const pageTitle = computed(() => {
  if (route.meta?.title) return route.meta.title
  for (const [path, title] of Object.entries(titles)) {
    if (route.path === path || (path !== '/' && route.path.startsWith(path))) {
      return title
    }
  }
  return '优家优漖成长中心'
})

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

function handleLogout() {
  logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex min-h-screen">
    <!-- Sidebar -->
    <aside
      :class="[
        'fixed left-0 top-0 h-full z-30 transition-all duration-300 flex flex-col',
        'bg-gradient-to-b from-amber-400 via-orange-400 to-orange-500 shadow-xl',
        sidebarOpen ? 'w-60' : 'w-16'
      ]"
    >
      <div class="flex items-center justify-between p-4">
        <span v-if="sidebarOpen" class="text-white font-bold text-lg whitespace-nowrap">☀️ 优家优漖</span>
        <button @click="sidebarOpen = !sidebarOpen" class="text-white text-xl hover:bg-amber-600/30 rounded-lg p-1">
          {{ sidebarOpen ? '◀' : '▶' }}
        </button>
      </div>

      <nav class="flex-1 px-2 py-4 space-y-1">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          :class="[
            'flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200',
            isActive(item.path)
              ? 'bg-white/30 text-white font-semibold shadow-inner'
              : 'text-white/80 hover:bg-white/20 hover:text-white'
          ]"
        >
          <span class="text-xl">{{ item.icon }}</span>
          <span v-if="sidebarOpen" class="text-sm">{{ item.label }}</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-amber-300/50">
        <div class="flex items-center gap-2 mb-3" v-if="sidebarOpen">
          <div class="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-white font-bold text-sm">
            {{ user?.name?.charAt(0) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-white text-sm font-medium truncate">{{ user?.name }}</div>
            <div class="text-white/70 text-xs">{{ user?.role === 'admin' ? '管理员' : user?.role === 'teacher' ? '老师' : '家长' }}</div>
          </div>
        </div>
        <button @click="handleLogout" :class="['text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all', sidebarOpen ? 'w-full py-2 text-sm' : 'w-full py-2 flex justify-center']">
          {{ sidebarOpen ? '退出登录' : '🚪' }}
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div :class="['flex-1 transition-all duration-300', sidebarOpen ? 'ml-60' : 'ml-16']">
      <!-- Top Bar -->
      <header class="bg-white/90 backdrop-blur shadow-sm sticky top-0 z-20 px-6 py-4 flex items-center justify-between border-b-2 border-amber-100">
        <div>
          <h1 class="text-lg font-bold text-gray-800">{{ pageTitle }}</h1>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-500">{{ new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
        </div>
      </header>

      <main class="p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>
