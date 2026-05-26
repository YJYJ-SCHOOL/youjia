<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getStudentById, getFees, getFeeTypes, getFeedbacks, FEE_STATUS_LABELS, CATEGORY_LABELS } from '../stores/index.js'

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id)
const student = computed(() => getStudentById(id.value))

const allFeeTypes = computed(() => getFeeTypes())
function feeTypeName(feeTypeId) { return allFeeTypes.value.find(ft => ft.id === feeTypeId)?.name || '未知' }

const studentFees = computed(() => {
  return getFees({ studentId: id.value })
})

const studentFeedbacks = computed(() => {
  return getFeedbacks({ studentId: id.value })
})

function statusBadge(status) {
  const map = { pending: 'bg-amber-100 text-amber-600', paid: 'bg-emerald-100 text-emerald-600', overdue: 'bg-rose-100 text-rose-600', partial: 'bg-sky-100 text-sky-600' }
  return map[status] || 'bg-gray-100 text-gray-600'
}

const categoryIcons = { academic: '📚', behavior: '🤝', social: '💬', health: '💪' }
</script>

<template>
  <div v-if="student">
    <!-- 学生信息头 -->
    <div class="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-2xl p-6 text-white shadow-lg mb-6">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center text-3xl font-bold">
          {{ student.name.charAt(0) }}
        </div>
        <div class="flex-1">
          <h1 class="text-2xl font-bold">{{ student.name }}</h1>
          <p class="text-white/80 text-sm">{{ student.grade }} · 入学 {{ student.enrollmentDate }}</p>
        </div>
        <span :class="['px-3 py-1 rounded-full text-sm font-bold', student.status === 'active' ? 'bg-white/30' : 'bg-gray-500/30']">
          {{ student.status === 'active' ? '在读' : '已离校' }}
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- 费用记录 -->
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <h2 class="text-lg font-bold text-gray-800 mb-4">💳 费用记录</h2>
        <div v-if="studentFees.length === 0" class="text-center py-8 text-gray-400">暂无费用记录</div>
        <div class="space-y-2">
          <div v-for="fee in studentFees" :key="fee.id"
               class="flex items-center justify-between p-3 rounded-xl border"
               :class="fee.status === 'paid' ? 'bg-emerald-50 border-emerald-100' : fee.status === 'overdue' ? 'bg-rose-50 border-rose-100' : 'bg-gray-50 border-gray-100'">
            <div>
              <div class="text-sm font-medium text-gray-700">{{ feeTypeName(fee.feeTypeId) }} · ¥{{ fee.amount.toLocaleString() }}</div>
              <div class="text-xs text-gray-400">截止 {{ fee.dueDate }}</div>
            </div>
            <span :class="['text-xs font-bold px-2.5 py-1 rounded-full', statusBadge(fee.status)]">
              {{ FEE_STATUS_LABELS[fee.status] }}
            </span>
          </div>
        </div>
      </div>

      <!-- 反馈记录 -->
      <div class="bg-white rounded-2xl shadow-sm p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-800">📝 阶段反馈</h2>
          <button @click="router.push(`/feedback/${student.id}`)" class="text-sm text-sky-500 hover:text-sky-600 font-medium">
            查看全部 →
          </button>
        </div>
        <div v-if="studentFeedbacks.length === 0" class="text-center py-8 text-gray-400">暂无反馈记录</div>
        <div class="space-y-3">
          <div v-for="fb in studentFeedbacks.slice(0, 5)" :key="fb.id"
               class="p-4 rounded-xl border-l-4 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
               :class="{
                 'border-amber-400': fb.category === 'academic',
                 'border-sky-400': fb.category === 'behavior',
                 'border-emerald-400': fb.category === 'social',
                 'border-rose-400': fb.category === 'health',
               }"
               @click="router.push(`/feedback/${student.id}`)">
            <div class="flex items-center gap-2 mb-1">
              <span>{{ categoryIcons[fb.category] }}</span>
              <span class="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">{{ fb.period }}</span>
              <span class="text-xs text-gray-400">{{ CATEGORY_LABELS[fb.category] }}</span>
              <div class="text-amber-400 text-xs ml-auto">
                {{ '⭐'.repeat(fb.rating) }}
              </div>
            </div>
            <p class="text-xs text-gray-500 line-clamp-2">{{ fb.content }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="text-center py-20 text-gray-400">
    <div class="text-6xl mb-4">🔍</div>
    <p class="text-lg">学生不存在或已被删除</p>
    <button @click="router.push('/students')" class="mt-4 text-amber-500 hover:text-amber-600 font-medium">← 返回学生列表</button>
  </div>
</template>
