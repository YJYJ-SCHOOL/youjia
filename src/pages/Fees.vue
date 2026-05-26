<script setup>
import { ref, computed, watch } from 'vue'
import { getFees, getStudents, getFeeTypes, addFee, updateFee, deleteFee, markFeePaid, recordAttendance, FEE_STATUS_LABELS, FEE_CATEGORY_LABELS } from '../stores/index.js'

const fees = ref([])
const allStudents = ref([])
const allFeeTypes = ref([])
const filterStatus = ref('')
const filterStudent = ref('')
const filterFeeType = ref('')
const showModal = ref(false)
const showPayModal = ref(false)
const editingFee = ref(null)
const payingFee = ref(null)
const payAmount = ref(0)

const form = ref({ studentId: '', feeTypeId: '', amount: '', dueDate: '' })

const statusOptionsMap = { '': '全部状态', ...FEE_STATUS_LABELS }

function refresh() {
  allStudents.value = getStudents()
  allFeeTypes.value = getFeeTypes()
  fees.value = getFees({
    status: filterStatus.value || undefined,
    studentId: filterStudent.value || undefined,
    feeTypeId: filterFeeType.value || undefined,
  }).map(f => ({
    ...f,
    studentName: allStudents.value.find(s => s.id === f.studentId)?.name || '未知',
    feeTypeName: allFeeTypes.value.find(ft => ft.id === f.feeTypeId)?.name || '未知类型',
    feeType: allFeeTypes.value.find(ft => ft.id === f.feeTypeId),
  }))
}

watch([filterStatus, filterStudent, filterFeeType], refresh, { immediate: true })

const selectedFeeType = computed(() => {
  return allFeeTypes.value.find(ft => ft.id === form.value.feeTypeId)
})

function openAdd() {
  editingFee.value = null
  form.value = {
    studentId: allStudents.value[0]?.id || '',
    feeTypeId: allFeeTypes.value[0]?.id || '',
    amount: allFeeTypes.value[0]?.price || '',
    dueDate: ''
  }
  showModal.value = true
}

function onFeeTypeChange() {
  const ft = selectedFeeType.value
  if (ft && !editingFee.value) {
    form.value.amount = ft.price
  }
}

function openEdit(fee) {
  editingFee.value = fee
  form.value = { studentId: fee.studentId, feeTypeId: fee.feeTypeId, amount: fee.amount, dueDate: fee.dueDate }
  showModal.value = true
}

function saveFee() {
  if (!form.value.studentId || !form.value.feeTypeId || !form.value.amount) return
  if (editingFee.value) {
    updateFee(editingFee.value.id, { feeTypeId: form.value.feeTypeId, amount: Number(form.value.amount), dueDate: form.value.dueDate })
  } else {
    addFee({ ...form.value, amount: Number(form.value.amount) })
  }
  showModal.value = false
  refresh()
}

function removeFee(id) {
  if (confirm('确定删除该费用记录？关联的请假记录也将被清理。')) {
    deleteFee(id)
    refresh()
  }
}

function openPay(fee) {
  payingFee.value = fee
  payAmount.value = fee.amount - (fee.paidAmount || 0)
  showPayModal.value = true
}

function doPay() {
  if (payingFee.value && payAmount.value > 0) {
    markFeePaid(payingFee.value.id, payAmount.value)
    showPayModal.value = false
    refresh()
  }
}

function doAttendance(fee) {
  recordAttendance(fee.id, 1)
  refresh()
}

function statusBadge(status) {
  const map = { pending: 'bg-amber-100 text-amber-600', paid: 'bg-emerald-100 text-emerald-600', overdue: 'bg-rose-100 text-rose-600', partial: 'bg-sky-100 text-sky-600' }
  return map[status] || 'bg-gray-100 text-gray-600'
}

function categoryBadge(cat) {
  const map = { training: 'bg-violet-100 text-violet-600', care: 'bg-sky-100 text-sky-600', meal: 'bg-orange-100 text-orange-600' }
  return map[cat] || 'bg-gray-100 text-gray-600'
}
</script>

<template>
  <div>
    <!-- 操作栏 -->
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <button @click="openAdd" class="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-400/30 hover:shadow-xl active:scale-95 transition-all">
        ＋ 新增费用
      </button>

      <select v-model="filterStatus" class="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm outline-none focus:border-amber-400">
        <option v-for="(label, val) in statusOptionsMap" :key="val" :value="val">{{ label }}</option>
      </select>

      <select v-model="filterStudent" class="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm outline-none focus:border-amber-400">
        <option value="">全部学生</option>
        <option v-for="s in allStudents" :key="s.id" :value="s.id">{{ s.name }}</option>
      </select>

      <select v-model="filterFeeType" class="px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm outline-none focus:border-amber-400">
        <option value="">全部类型</option>
        <option v-for="ft in allFeeTypes" :key="ft.id" :value="ft.id">{{ ft.name }}</option>
      </select>

      <span class="text-sm text-gray-400 ml-auto">{{ fees.length }} 条记录</span>
    </div>

    <!-- 费用表格 -->
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50">
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">学生</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">费用类型</th>
              <th class="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">金额</th>
              <th class="text-center py-3 px-4 text-xs font-semibold text-gray-500 uppercase">课时进度</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">截止日期</th>
              <th class="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">状态</th>
              <th class="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="fees.length === 0">
              <td colspan="7" class="text-center py-12 text-gray-400">暂无费用记录，点击上方按钮添加</td>
            </tr>
            <tr v-for="fee in fees" :key="fee.id" class="border-t border-gray-50 hover:bg-amber-50/30 transition-colors">
              <td class="py-3 px-4">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-600">
                    {{ fee.studentName?.charAt(0) }}
                  </div>
                  <span class="text-sm font-medium text-gray-700">{{ fee.studentName }}</span>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="flex items-center gap-1.5">
                  <span class="text-sm text-gray-700">{{ fee.feeTypeName }}</span>
                  <span :class="['text-xs px-1.5 py-0.5 rounded-full font-medium', categoryBadge(fee.feeType?.category)]">
                    {{ FEE_CATEGORY_LABELS[fee.feeType?.category] || '' }}
                  </span>
                </div>
              </td>
              <td class="py-3 px-4 text-right text-sm font-semibold text-gray-700">¥{{ fee.amount.toLocaleString() }}</td>
              <td class="py-3 px-4 text-center">
                <template v-if="fee.feeType?.hasHourTracking && fee.totalHours > 0">
                  <div class="flex items-center justify-center gap-1">
                    <span class="text-sm font-medium" :class="fee.attendedHours >= fee.totalHours ? 'text-emerald-600' : 'text-sky-600'">
                      {{ fee.attendedHours }}/{{ fee.totalHours }}
                    </span>
                    <span class="text-xs text-gray-400">课时</span>
                  </div>
                  <div class="w-20 h-1.5 bg-gray-200 rounded-full mx-auto mt-1 overflow-hidden">
                    <div class="h-full rounded-full transition-all"
                         :class="fee.attendedHours >= fee.totalHours ? 'bg-emerald-400' : 'bg-sky-400'"
                         :style="{ width: Math.min(100, (fee.attendedHours / fee.totalHours) * 100) + '%' }"></div>
                  </div>
                </template>
                <span v-else class="text-xs text-gray-300">-</span>
              </td>
              <td class="py-3 px-4 text-sm" :class="fee.status === 'overdue' ? 'text-rose-500 font-medium' : 'text-gray-500'">
                {{ fee.dueDate }}
              </td>
              <td class="py-3 px-4">
                <span :class="['text-xs font-bold px-2.5 py-1 rounded-full', statusBadge(fee.status)]">
                  {{ FEE_STATUS_LABELS[fee.status] }}
                  <template v-if="fee.status === 'partial'"> ¥{{ fee.paidAmount }}</template>
                </span>
              </td>
              <td class="py-3 px-4 text-right">
                <div class="flex items-center justify-end gap-1">
                  <button v-if="fee.status !== 'paid'" @click="openPay(fee)"
                    class="px-2.5 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors">缴费</button>
                  <button v-if="fee.feeType?.hasHourTracking" @click="doAttendance(fee)"
                    class="px-2.5 py-1.5 bg-sky-500 text-white text-xs font-medium rounded-lg hover:bg-sky-600 transition-colors">签到</button>
                  <button @click="openEdit(fee)"
                    class="px-2.5 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors">编辑</button>
                  <button @click="removeFee(fee.id)"
                    class="px-2.5 py-1.5 bg-rose-50 text-rose-500 text-xs font-medium rounded-lg hover:bg-rose-100 transition-colors">删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" @click.self="showModal = false">
      <div class="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold text-gray-800 mb-5">{{ editingFee ? '编辑费用' : '新增费用' }}</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">学生</label>
            <select v-model="form.studentId" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 outline-none focus:border-amber-400">
              <option v-for="s in allStudents" :key="s.id" :value="s.id">{{ s.name }} ({{ s.grade }})</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">费用类型</label>
            <select v-model="form.feeTypeId" @change="onFeeTypeChange" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 outline-none focus:border-amber-400">
              <option v-for="ft in allFeeTypes" :key="ft.id" :value="ft.id">
                {{ ft.name }} — ¥{{ ft.price }} {{ ft.hasHourTracking ? `(${ft.totalHours}课时)` : '' }}
              </option>
            </select>
            <p v-if="selectedFeeType" class="text-xs text-gray-400 mt-1">{{ selectedFeeType.description }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">金额 (元)</label>
            <input v-model.number="form.amount" type="number" step="0.01" placeholder="请输入金额"
              class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-amber-400" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">截止日期</label>
            <input v-model="form.dueDate" type="date"
              class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-amber-400" />
          </div>
          <div v-if="selectedFeeType?.hasHourTracking" class="bg-sky-50 rounded-xl p-3 text-xs text-sky-700">
            💡 该类型为培训班课程，系统将自动追踪课时进度（{{ selectedFeeType.totalHours }}课时）
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showModal = false" class="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200">取消</button>
          <button @click="saveFee" class="flex-1 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all">
            {{ editingFee ? '保存修改' : '确认添加' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 缴费弹窗 -->
    <div v-if="showPayModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" @click.self="showPayModal = false">
      <div class="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <h2 class="text-xl font-bold text-gray-800 mb-3">确认缴费</h2>
        <p class="text-sm text-gray-500 mb-4">
          学生：<strong>{{ payingFee?.studentName }}</strong><br>
          类型：{{ payingFee?.feeTypeName }} · 应付 ¥{{ payingFee?.amount?.toLocaleString() }}
          <template v-if="payingFee?.paidAmount > 0"> · 已付 ¥{{ payingFee?.paidAmount?.toLocaleString() }}</template>
        </p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-600 mb-1">缴费金额 (元)</label>
          <input v-model.number="payAmount" type="number" step="0.01"
            class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-emerald-400" />
        </div>
        <div class="flex gap-3">
          <button @click="showPayModal = false" class="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200">取消</button>
          <button @click="doPay" class="flex-1 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-400/30">确认缴费</button>
        </div>
      </div>
    </div>
  </div>
</template>
