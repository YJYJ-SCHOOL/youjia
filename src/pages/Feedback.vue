<script setup>
import { ref, computed } from 'vue'
import { getStudents, getFeeTypes, getFeedbacks, addFeedback, deleteFeedback, getCurrentUser, CATEGORY_LABELS } from '../stores/index.js'

const user = computed(() => getCurrentUser())
const allStudents = ref([])
const allFeeTypes = ref([])
const feedbacks = ref([])
const filterStudent = ref('')
const filterCategory = ref('')
const filterFeeType = ref('')
const showModal = ref(false)

const form = ref({ studentId: '', feeTypeId: '', period: '', category: 'academic', rating: 5, content: '' })

const categoryIcons = { academic: '📚', behavior: '🤝', social: '💬', health: '💪' }

function refresh() {
  allStudents.value = getStudents()
  allFeeTypes.value = getFeeTypes()
  feedbacks.value = getFeedbacks({
    studentId: filterStudent.value || undefined,
    teacherId: user.value?.role === 'teacher' ? user.value.id : undefined,
    category: filterCategory.value || undefined,
    feeTypeId: filterFeeType.value || undefined,
  }).map(f => ({
    ...f,
    studentName: allStudents.value.find(s => s.id === f.studentId)?.name || '未知',
    teacherName: f.teacherId === 'u2' ? '李老师' : '王老师',
    feeTypeName: allFeeTypes.value.find(ft => ft.id === f.feeTypeId)?.name || '综合'
  }))
}
refresh()

// 老师只看到自己负责的费用类型的反馈模板
const myFeeTypes = computed(() => {
  if (user.value?.role === 'admin') return allFeeTypes.value
  return allFeeTypes.value.filter(ft => ft.teacherId === user.value?.id)
})

function openAdd() {
  form.value = {
    studentId: allStudents.value[0]?.id || '',
    feeTypeId: myFeeTypes.value[0]?.id || '',
    period: `${new Date().getFullYear()}年${new Date().getMonth() + 1}月`,
    category: 'academic', rating: 5, content: ''
  }
  showModal.value = true
}

function saveFeedback() {
  if (!form.value.studentId || !form.value.content) return
  addFeedback({ ...form.value, teacherId: user.value.id })
  showModal.value = false
  refresh()
}

function removeFeedback(id) {
  if (confirm('确定删除该反馈？')) { deleteFeedback(id); refresh() }
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <button @click="openAdd" class="px-5 py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-400/30 hover:shadow-xl active:scale-95 transition-all">
        ＋ 新增反馈
      </button>
      <select v-model="filterStudent" @change="refresh" class="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm outline-none focus:border-sky-400">
        <option value="">全部学生</option>
        <option v-for="s in allStudents" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <select v-model="filterCategory" @change="refresh" class="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm outline-none focus:border-sky-400">
        <option value="">全部分类</option>
        <option v-for="(label, val) in CATEGORY_LABELS" :key="val" :value="val">{{ label }}</option>
      </select>
      <select v-model="filterFeeType" @change="refresh" class="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm outline-none focus:border-sky-400">
        <option value="">全部课程</option>
        <option v-for="ft in allFeeTypes" :key="ft.id" :value="ft.id">{{ ft.name }}</option>
      </select>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-if="feedbacks.length === 0" class="col-span-full text-center py-16 text-gray-400">
        <div class="text-6xl mb-4">📝</div><p class="text-lg">还没有反馈记录</p>
      </div>
      <div v-for="fb in feedbacks" :key="fb.id" class="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-all border-t-4"
           :class="{ 'border-amber-400': fb.category === 'academic', 'border-sky-400': fb.category === 'behavior', 'border-emerald-400': fb.category === 'social', 'border-rose-400': fb.category === 'health' }">
        <div class="flex items-start justify-between mb-3">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-2xl">{{ categoryIcons[fb.category] || '📋' }}</span>
              <span class="font-bold text-gray-800">{{ fb.studentName }}</span>
              <span class="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">{{ fb.feeTypeName }}</span>
              <span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{{ fb.period }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs text-gray-400">
              <span>{{ CATEGORY_LABELS[fb.category] }}</span><span>·</span>
              <span>{{ fb.teacherName }}</span><span>·</span>
              <span>{{ fb.createdAt }}</span>
            </div>
          </div>
          <button @click="removeFeedback(fb.id)" class="text-gray-300 hover:text-rose-400 transition-colors text-lg">×</button>
        </div>
        <div class="flex mb-3 text-amber-400 text-sm">{{ '⭐'.repeat(fb.rating) }}{{ '☆'.repeat(5 - fb.rating) }}</div>
        <p class="text-sm text-gray-600 leading-relaxed">{{ fb.content }}</p>
      </div>
    </div>

    <!-- 新增弹窗 -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" @click.self="showModal = false">
      <div class="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold text-gray-800 mb-5">新增学生反馈</h2>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">学生</label>
              <select v-model="form.studentId" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 outline-none focus:border-sky-400">
                <option v-for="s in allStudents" :key="s.id" :value="s.id">{{ s.name }} ({{ s.grade }})</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">周期</label>
              <input v-model="form.period" type="text" placeholder="如：2026年5月" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-sky-400" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">关联课程</label>
            <select v-model="form.feeTypeId" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 outline-none focus:border-sky-400">
              <option value="">综合（不关联具体课程）</option>
              <option v-for="ft in myFeeTypes" :key="ft.id" :value="ft.id">{{ ft.name }} ({{ ft.teacherId === 'u2' ? '李老师' : '王老师' }})</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">分类</label>
            <div class="grid grid-cols-4 gap-2">
              <button v-for="(label, val) in CATEGORY_LABELS" :key="val" @click="form.category = val"
                :class="['py-2 px-3 rounded-xl text-sm font-medium transition-all border-2', form.category === val ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-gray-200 text-gray-500 hover:border-gray-300']">
                {{ categoryIcons[val] }} {{ label }}
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">评分</label>
            <div class="flex gap-1 text-3xl">
              <button v-for="i in 5" :key="i" @click="form.rating = i" class="transition-all hover:scale-110">{{ i <= form.rating ? '⭐' : '☆' }}</button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">反馈内容</label>
            <textarea v-model="form.content" rows="4" placeholder="详细描述学生在本阶段/本课程的表现、问题及建议..." class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-sky-400 resize-none"></textarea>
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showModal = false" class="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200">取消</button>
          <button @click="saveFeedback" class="flex-1 py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg transition-all">确认提交</button>
        </div>
      </div>
    </div>
  </div>
</template>
