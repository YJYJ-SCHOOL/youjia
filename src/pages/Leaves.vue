<script setup>
import { ref, computed } from 'vue'
import { getStudents, getFees, getFeeTypes, getLeaves, addLeave, updateLeave, deleteLeave, LEAVE_STATUS_LABELS } from '../stores/index.js'

const allStudents = ref([])
const allFees = ref([])
const allFeeTypes = ref([])
const leaves = ref([])
const filterStudent = ref('')
const filterStatus = ref('')
const showModal = ref(false)
const editingLeave = ref(null)
const form = ref({ studentId: '', feeId: '', date: '', reason: '', status: 'pending', makeupDate: '', note: '' })

const statusOptions = { '': '全部状态', ...LEAVE_STATUS_LABELS }

function refresh() {
  allStudents.value = getStudents()
  allFeeTypes.value = getFeeTypes()
  allFees.value = getFees()
  leaves.value = getLeaves({
    studentId: filterStudent.value || undefined,
    status: filterStatus.value || undefined,
  }).map(l => ({
    ...l,
    studentName: allStudents.value.find(s => s.id === l.studentId)?.name || '未知',
    feeTypeName: (() => {
      const fee = allFees.value.find(f => f.id === l.feeId)
      if (!fee) return '未知'
      return allFeeTypes.value.find(ft => ft.id === fee.feeTypeId)?.name || '未知'
    })(),
  }))
}
refresh()

// 当选择学生时，筛选该学生的费用（培训班类）
const availableFees = computed(() => {
  if (!form.value.studentId) return []
  return allFees.value.filter(f => {
    if (f.studentId !== form.value.studentId) return false
    const ft = allFeeTypes.value.find(ft => ft.id === f.feeTypeId)
    return ft?.hasHourTracking // 只有培训班课程需要记录请假
  })
})

function openAdd() {
  editingLeave.value = null
  form.value = { studentId: allStudents.value[0]?.id || '', feeId: '', date: new Date().toISOString().slice(0, 10), reason: '', status: 'pending', makeupDate: '', note: '' }
  showModal.value = true
}

function openEdit(l) {
  editingLeave.value = l
  form.value = { studentId: l.studentId, feeId: l.feeId, date: l.date, reason: l.reason, status: l.status, makeupDate: l.makeupDate || '', note: l.note || '' }
  showModal.value = true
}

function saveLeave() {
  if (!form.value.studentId || !form.value.feeId || !form.value.date) return
  if (editingLeave.value) {
    updateLeave(editingLeave.value.id, form.value)
  } else {
    addLeave(form.value)
  }
  showModal.value = false
  refresh()
}

function removeLeave(id) {
  if (confirm('确定删除该请假记录？')) {
    deleteLeave(id)
    refresh()
  }
}

function quickMark(l, status) {
  updateLeave(l.id, { ...l, status })
  refresh()
}

function statusBadge(status) {
  const map = { pending: 'bg-amber-100 text-amber-600', makeup: 'bg-sky-100 text-sky-600', refunded: 'bg-rose-100 text-rose-600' }
  return map[status] || 'bg-gray-100 text-gray-600'
}
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <button @click="openAdd" class="px-5 py-2.5 bg-gradient-to-r from-violet-400 to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-violet-400/30 hover:shadow-xl active:scale-95 transition-all">
        ＋ 登记请假
      </button>
      <select v-model="filterStudent" @change="refresh" class="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm outline-none focus:border-violet-400">
        <option value="">全部学生</option>
        <option v-for="s in allStudents" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>
      <select v-model="filterStatus" @change="refresh" class="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm outline-none focus:border-violet-400">
        <option v-for="(label, val) in statusOptions" :key="val" :value="val">{{ label }}</option>
      </select>
    </div>

    <!-- 统计 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-amber-400">
        <div class="text-gray-400 text-xs">待处理</div>
        <div class="text-2xl font-bold text-gray-800">{{ leaves.filter(l => l.status === 'pending').length }}<span class="text-sm font-normal text-gray-400"> 条</span></div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-sky-400">
        <div class="text-gray-400 text-xs">已补课</div>
        <div class="text-2xl font-bold text-gray-800">{{ leaves.filter(l => l.status === 'makeup').length }}<span class="text-sm font-normal text-gray-400"> 条</span></div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border-l-4 border-rose-400">
        <div class="text-gray-400 text-xs">已退费</div>
        <div class="text-2xl font-bold text-gray-800">{{ leaves.filter(l => l.status === 'refunded').length }}<span class="text-sm font-normal text-gray-400"> 条</span></div>
      </div>
    </div>

    <!-- 请假列表 -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-gray-50">
            <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">学生</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">关联课程</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">请假日期</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">原因</th>
            <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">状态</th>
            <th class="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="leaves.length === 0">
            <td colspan="6" class="text-center py-12 text-gray-400">暂无请假记录</td>
          </tr>
          <tr v-for="l in leaves" :key="l.id" class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
            <td class="py-3 px-4">
              <span class="text-sm font-medium text-gray-700">{{ l.studentName }}</span>
            </td>
            <td class="py-3 px-4">
              <span class="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">{{ l.feeTypeName }}</span>
            </td>
            <td class="py-3 px-4 text-sm text-gray-600">{{ l.date }}</td>
            <td class="py-3 px-4 text-sm text-gray-500 max-w-[180px] truncate">{{ l.reason || '-' }}</td>
            <td class="py-3 px-4">
              <span :class="['text-xs font-bold px-2.5 py-1 rounded-full', statusBadge(l.status)]">
                {{ LEAVE_STATUS_LABELS[l.status] }}
              </span>
              <div v-if="l.makeupDate" class="text-xs text-gray-400 mt-0.5">补课: {{ l.makeupDate }}</div>
            </td>
            <td class="py-3 px-4 text-right">
              <div class="flex items-center justify-end gap-1">
                <template v-if="l.status === 'pending'">
                  <button @click="quickMark(l, 'makeup')" class="px-2 py-1 bg-sky-100 text-sky-600 text-xs rounded-lg hover:bg-sky-200 transition-colors">标记补课</button>
                  <button @click="quickMark(l, 'refunded')" class="px-2 py-1 bg-rose-100 text-rose-600 text-xs rounded-lg hover:bg-rose-200 transition-colors">标记退费</button>
                </template>
                <button @click="openEdit(l)" class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition-colors">编辑</button>
                <button @click="removeLeave(l.id)" class="px-2 py-1 bg-gray-100 text-gray-400 text-xs rounded-lg hover:bg-rose-50 hover:text-rose-500 transition-colors">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" @click.self="showModal = false">
      <div class="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold text-gray-800 mb-5">{{ editingLeave ? '编辑请假' : '登记请假' }}</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">学生</label>
            <select v-model="form.studentId" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 outline-none focus:border-violet-400">
              <option v-for="s in allStudents" :key="s.id" :value="s.id">{{ s.name }} ({{ s.grade }})</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">关联课程（培训班）</label>
            <select v-model="form.feeId" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 outline-none focus:border-violet-400">
              <option value="">请选择课程</option>
              <option v-for="f in availableFees" :key="f.id" :value="f.id">
                {{ allFeeTypes.find(ft => ft.id === f.feeTypeId)?.name || '未知' }}
                — ¥{{ f.amount }} ({{ f.attendedHours }}/{{ f.totalHours }}课时)
              </option>
            </select>
            <p v-if="form.studentId && availableFees.length === 0" class="text-xs text-amber-500 mt-1">该学生没有培训班课程，请先在费用管理中添加培训班费用</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">请假日期</label>
            <input v-model="form.date" type="date" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-violet-400" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">请假原因</label>
            <input v-model="form.reason" type="text" placeholder="如：感冒发烧、家里有事..." class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-violet-400" />
          </div>
          <div v-if="editingLeave">
            <label class="block text-sm font-medium text-gray-600 mb-1">处理状态</label>
            <select v-model="form.status" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 outline-none focus:border-violet-400">
              <option value="pending">待处理</option>
              <option value="makeup">已补课</option>
              <option value="refunded">已退费</option>
            </select>
          </div>
          <div v-if="form.status === 'makeup'">
            <label class="block text-sm font-medium text-gray-600 mb-1">补课日期</label>
            <input v-model="form.makeupDate" type="date" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-violet-400" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">备注</label>
            <input v-model="form.note" type="text" placeholder="补充说明..." class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-violet-400" />
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showModal = false" class="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200">取消</button>
          <button @click="saveLeave" class="flex-1 py-2.5 bg-gradient-to-r from-violet-400 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg transition-all">
            {{ editingLeave ? '保存修改' : '确认登记' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
