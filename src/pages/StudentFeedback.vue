<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { getStudentById, getFeedbacks, CATEGORY_LABELS } from '../stores/index.js'

const route = useRoute()
const studentId = computed(() => route.params.studentId)
const student = computed(() => getStudentById(studentId.value))

const categoryIcons = { academic: '📚', behavior: '🤝', social: '💬', health: '💪' }
const filterCategory = ref('')

const feedbacks = computed(() => {
  return getFeedbacks({
    studentId: studentId.value,
    category: filterCategory.value || undefined,
  }).map(f => ({
    ...f,
    teacherName: f.teacherId === 'u2' ? '李老师' : '王老师'
  }))
})

// 按周期分组
const groupedFeedbacks = computed(() => {
  const groups = {}
  for (const fb of feedbacks.value) {
    if (!groups[fb.period]) groups[fb.period] = []
    groups[fb.period].push(fb)
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
})
</script>

<template>
  <div>
    <!-- 学生信息卡片 -->
    <div class="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 rounded-2xl p-6 text-white shadow-lg mb-6">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full bg-white/30 flex items-center justify-center text-3xl font-bold">
          {{ student?.name?.charAt(0) }}
        </div>
        <div>
          <h1 class="text-2xl font-bold">{{ student?.name }}</h1>
          <p class="text-white/80 text-sm">{{ student?.grade }} · 入学 {{ student?.enrollmentDate }}</p>
        </div>
      </div>
    </div>

    <!-- 筛选 -->
    <div class="flex items-center gap-3 mb-6">
      <span class="text-sm text-gray-500">筛选：</span>
      <button @click="filterCategory = ''"
        :class="['px-4 py-2 rounded-xl text-sm font-medium transition-all border-2', !filterCategory ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-gray-200 text-gray-500']">
        全部
      </button>
      <button v-for="(label, val) in CATEGORY_LABELS" :key="val" @click="filterCategory = val"
        :class="['px-4 py-2 rounded-xl text-sm font-medium transition-all border-2', filterCategory === val ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-gray-200 text-gray-500']">
        {{ categoryIcons[val] }} {{ label }}
      </button>
    </div>

    <!-- 按周期分组反馈 -->
    <div v-if="groupedFeedbacks.length === 0" class="text-center py-16 text-gray-400">
      <div class="text-6xl mb-4">📭</div>
      <p>该学生暂无反馈记录</p>
    </div>

    <div v-else class="space-y-6">
      <div v-for="[period, fbs] in groupedFeedbacks" :key="period">
        <h3 class="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
          <span>📅</span> {{ period }}
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div v-for="fb in fbs" :key="fb.id"
               class="bg-white rounded-xl p-4 shadow-sm border-l-4 hover:shadow-md transition-all"
               :class="{
                 'border-amber-400': fb.category === 'academic',
                 'border-sky-400': fb.category === 'behavior',
                 'border-emerald-400': fb.category === 'social',
                 'border-rose-400': fb.category === 'health',
               }">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-lg">{{ categoryIcons[fb.category] }}</span>
              <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                {{ CATEGORY_LABELS[fb.category] }}
              </span>
              <div class="text-amber-400 text-xs ml-auto">
                {{ '⭐'.repeat(fb.rating) }}{{ '☆'.repeat(5 - fb.rating) }}
              </div>
            </div>
            <p class="text-sm text-gray-600 leading-relaxed">{{ fb.content }}</p>
            <div class="text-xs text-gray-400 mt-2">{{ fb.teacherName }} · {{ fb.createdAt }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
