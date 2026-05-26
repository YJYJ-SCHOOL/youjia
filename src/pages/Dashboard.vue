<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser, getStudents, getFees, getFeeTypes, getFeedbacks, getOverdueFees, getDueSoonFees, getMonthlyStats, getMyChildren, FEE_STATUS_LABELS } from '../stores/index.js'

const router = useRouter()
const user = computed(() => getCurrentUser())
const allStudents = computed(() => getStudents())
const allFeeTypes = computed(() => getFeeTypes())
const stats = computed(() => getMonthlyStats())

function feeTypeName(feeTypeId) {
  return allFeeTypes.value.find(ft => ft.id === feeTypeId)?.name || '未知'
}

const overdueFees = computed(() => {
  const fees = getOverdueFees()
  return fees.map(f => ({
    ...f,
    studentName: allStudents.value.find(s => s.id === f.studentId)?.name || '未知'
  }))
})

const dueSoonFees = computed(() => {
  const fees = getDueSoonFees(7)
  return fees.map(f => ({
    ...f,
    studentName: allStudents.value.find(s => s.id === f.studentId)?.name || '未知'
  }))
})

const recentFeedbacks = computed(() => {
  const fbs = getFeedbacks()
  return fbs.slice(0, 5).map(f => ({
    ...f,
    studentName: allStudents.value.find(s => s.id === f.studentId)?.name || '未知',
    teacherName: f.teacherId === 'u2' ? '李老师' : '王老师'
  }))
})

// 家长视图 - 我的孩子
const myChildren = computed(() => {
  if (user.value?.role !== 'parent') return []
  return getMyChildren(user.value.id)
})

// 家长视图 - 孩子相关费用
const childrenFees = computed(() => {
  if (user.value?.role !== 'parent') return []
  const childIds = myChildren.value.map(c => c.id)
  return getFees().filter(f => childIds.includes(f.studentId)).map(f => ({
    ...f,
    studentName: allStudents.value.find(s => s.id === f.studentId)?.name || '未知'
  }))
})

// 家长视图 - 孩子相关反馈
const childrenFeedbacks = computed(() => {
  if (user.value?.role !== 'parent') return []
  const childIds = myChildren.value.map(c => c.id)
  return getFeedbacks().filter(f => childIds.includes(f.studentId)).slice(0, 5).map(f => ({
    ...f,
    studentName: allStudents.value.find(s => s.id === f.studentId)?.name || '未知'
  }))
})

const activeStudents = computed(() => allStudents.value.filter(s => s.status === 'active').length)
</script>

<template>
  <div>
    <!-- 统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-amber-400 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-gray-400 text-sm">在读学生</div>
            <div class="text-3xl font-bold text-gray-800 mt-1">{{ activeStudents }}<span class="text-lg text-gray-400 font-normal"> 人</span></div>
          </div>
          <div class="text-4xl">👦</div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-sky-400 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-gray-400 text-sm">本月应收</div>
            <div class="text-3xl font-bold text-gray-800 mt-1">¥{{ stats.total.toLocaleString() }}</div>
          </div>
          <div class="text-4xl">💰</div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-emerald-400 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-gray-400 text-sm">本月已收</div>
            <div class="text-3xl font-bold text-gray-800 mt-1">¥{{ stats.received.toLocaleString() }}</div>
          </div>
          <div class="text-4xl">✅</div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-rose-400 hover:shadow-md transition-shadow">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-gray-400 text-sm">待处理</div>
            <div class="text-3xl font-bold text-gray-800 mt-1">{{ overdueFees.length + stats.pending }}<span class="text-lg text-gray-400 font-normal"> 笔</span></div>
          </div>
          <div class="text-4xl">📋</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <!-- 费用预警 -->
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-800">⚠️ 费用预警</h2>
          <router-link to="/fees/alerts" class="text-sm text-amber-500 hover:text-amber-600 font-medium">查看全部 →</router-link>
        </div>

        <div v-if="overdueFees.length === 0 && dueSoonFees.length === 0" class="text-center py-8 text-gray-400">
          <div class="text-4xl mb-2">🎉</div>
          <p>暂无预警，一切正常！</p>
        </div>

        <div class="space-y-2">
          <div v-for="fee in overdueFees.slice(0, 3)" :key="fee.id"
               class="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-100">
            <div class="flex items-center gap-3">
              <span class="text-lg">🔴</span>
              <div>
                <div class="text-sm font-medium text-gray-700">{{ fee.studentName }}</div>
                <div class="text-xs text-gray-400">{{ feeTypeName(fee.feeTypeId) }} · ¥{{ fee.amount }} · 截止 {{ fee.dueDate }}</div>
              </div>
            </div>
            <span class="text-xs font-bold text-rose-500 bg-rose-100 px-2 py-1 rounded-full">逾期</span>
          </div>

          <div v-for="fee in dueSoonFees.slice(0, 2)" :key="fee.id"
               class="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
            <div class="flex items-center gap-3">
              <span class="text-lg">🟡</span>
              <div>
                <div class="text-sm font-medium text-gray-700">{{ fee.studentName }}</div>
                <div class="text-xs text-gray-400">{{ feeTypeName(fee.feeTypeId) }} · ¥{{ fee.amount }} · 截止 {{ fee.dueDate }}</div>
              </div>
            </div>
            <span class="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">即将到期</span>
          </div>
        </div>
      </div>

      <!-- 最近反馈 -->
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-800">📝 最近反馈</h2>
          <router-link to="/feedback" class="text-sm text-sky-500 hover:text-sky-600 font-medium">查看全部 →</router-link>
        </div>

        <div v-if="recentFeedbacks.length === 0" class="text-center py-8 text-gray-400">
          <div class="text-4xl mb-2">📭</div>
          <p>还没有反馈记录</p>
        </div>

        <div class="space-y-3">
          <div v-for="fb in recentFeedbacks" :key="fb.id"
               class="p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
               @click="router.push(`/feedback/${fb.studentId}`)">
            <div class="flex items-center justify-between mb-1">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-gray-700">{{ fb.studentName }}</span>
                <span class="text-xs bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full">{{ fb.period }}</span>
              </div>
              <div class="flex text-amber-400 text-xs">
                {{ '⭐'.repeat(fb.rating) }}{{ '☆'.repeat(5 - fb.rating) }}
              </div>
            </div>
            <p class="text-xs text-gray-500 line-clamp-2">{{ fb.content }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 家长专属视图 -->
    <div v-if="user?.role === 'parent'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 我的孩子费用 -->
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h2 class="text-lg font-bold text-gray-800 mb-4">💳 费用状态</h2>
        <div v-if="childrenFees.length === 0" class="text-center py-6 text-gray-400">暂无费用记录</div>
        <div class="space-y-2">
          <div v-for="fee in childrenFees" :key="fee.id"
               class="flex items-center justify-between p-3 rounded-xl border"
               :class="fee.status === 'paid' ? 'bg-emerald-50 border-emerald-100' : fee.status === 'overdue' ? 'bg-rose-50 border-rose-100' : 'bg-gray-50 border-gray-100'">
            <div>
              <div class="text-sm font-medium text-gray-700">{{ fee.studentName }} · {{ feeTypeName(fee.feeTypeId) }}</div>
              <div class="text-xs text-gray-400">¥{{ fee.amount }} · 截止 {{ fee.dueDate }}</div>
            </div>
            <span class="text-xs font-bold px-2 py-1 rounded-full"
                  :class="fee.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : fee.status === 'overdue' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'">
              {{ FEE_STATUS_LABELS[fee.status] }}
            </span>
          </div>
        </div>
      </div>

      <!-- 我的孩子反馈 -->
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h2 class="text-lg font-bold text-gray-800 mb-4">📬 孩子反馈</h2>
        <div v-if="childrenFeedbacks.length === 0" class="text-center py-6 text-gray-400">暂无反馈</div>
        <div class="space-y-3">
          <div v-for="fb in childrenFeedbacks" :key="fb.id"
               class="p-3 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
               @click="router.push(`/feedback/${fb.studentId}`)">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-semibold text-gray-700">{{ fb.studentName }} · {{ fb.period }}</span>
              <div class="text-amber-400 text-xs">{{ '⭐'.repeat(fb.rating) }}</div>
            </div>
            <p class="text-xs text-gray-500 line-clamp-2">{{ fb.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
