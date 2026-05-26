<script setup>
import { computed, ref } from 'vue'
import { getStudents, getFeeTypes, getOverdueFees, getDueSoonFees, markFeePaid } from '../stores/index.js'

const allStudents = ref([])
const allFeeTypes = ref([])
const showPayModal = ref(false)
const payingFee = ref(null)
const payAmount = ref(0)
const sentAlerts = ref(new Set())

function refresh() {
  allStudents.value = getStudents()
  allFeeTypes.value = getFeeTypes()
}
refresh()

function enrich(fees) {
  return fees.map(f => ({
    ...f,
    studentName: allStudents.value.find(s => s.id === f.studentId)?.name || '未知',
    feeTypeName: allFeeTypes.value.find(ft => ft.id === f.feeTypeId)?.name || '未知',
    feeType: allFeeTypes.value.find(ft => ft.id === f.feeTypeId),
    overdueDays: Math.floor((new Date() - new Date(f.dueDate)) / (1000 * 60 * 60 * 24)),
    remainingDays: Math.ceil((new Date(f.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
  }))
}

const overdueFees = computed(() => enrich(getOverdueFees()))
const dueSoonFees = computed(() => enrich(getDueSoonFees(7)))

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

function sendReminder(feeId) {
  sentAlerts.value.add(feeId)
  alert('已向家长发送缴费提醒通知！')
}
</script>

<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-gradient-to-br from-rose-400 to-rose-500 rounded-2xl p-5 text-white shadow-lg">
        <div class="text-rose-100 text-sm">逾期未缴</div>
        <div class="text-4xl font-bold mt-1">{{ overdueFees.length }}<span class="text-lg font-normal text-rose-100"> 笔</span></div>
        <div class="text-rose-100 text-sm mt-1">合计 ¥{{ overdueFees.reduce((s, f) => s + f.amount, 0).toLocaleString() }}</div>
      </div>
      <div class="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-5 text-white shadow-lg">
        <div class="text-amber-100 text-sm">7天内到期</div>
        <div class="text-4xl font-bold mt-1">{{ dueSoonFees.length }}<span class="text-lg font-normal text-amber-100"> 笔</span></div>
        <div class="text-amber-100 text-sm mt-1">合计 ¥{{ dueSoonFees.reduce((s, f) => s + f.amount, 0).toLocaleString() }}</div>
      </div>
      <div class="bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl p-5 text-white shadow-lg">
        <div class="text-emerald-100 text-sm">风险等级</div>
        <div class="text-4xl font-bold mt-1">
          {{ overdueFees.length > 3 ? '⚠️ 高' : overdueFees.length > 0 ? '⚡ 中' : '✅ 低' }}
        </div>
        <div class="text-emerald-100 text-sm mt-1">{{ overdueFees.length > 3 ? '需要立即处理' : overdueFees.length > 0 ? '请尽快跟进' : '一切正常' }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-2xl shadow-sm p-6">
        <div class="flex items-center gap-2 mb-5">
          <span class="text-2xl">🔴</span>
          <h2 class="text-lg font-bold text-gray-800">逾期费用</h2>
          <span class="text-sm text-gray-400">({{ overdueFees.length }})</span>
        </div>
        <div v-if="overdueFees.length === 0" class="text-center py-12 text-gray-400">
          <div class="text-5xl mb-3">🎉</div><p>没有逾期费用</p>
        </div>
        <div class="space-y-3">
          <div v-for="fee in overdueFees" :key="fee.id" class="p-4 rounded-xl bg-rose-50 border-2 border-rose-200 hover:shadow-md transition-all">
            <div class="flex items-start justify-between mb-2">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-gray-800">{{ fee.studentName }}</span>
                  <span class="text-xs bg-rose-200 text-rose-700 px-2 py-0.5 rounded-full font-medium">逾期 {{ fee.overdueDays }} 天</span>
                </div>
                <div class="text-sm text-gray-500 mt-1">{{ fee.feeTypeName }} · ¥{{ fee.amount.toLocaleString() }} · 截止 {{ fee.dueDate }}</div>
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="openPay(fee)" class="flex-1 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-sm">💳 缴费</button>
              <button @click="sendReminder(fee.id)" :disabled="sentAlerts.has(fee.id)"
                :class="['flex-1 py-2 text-sm font-bold rounded-xl transition-all shadow-sm', sentAlerts.has(fee.id) ? 'bg-gray-100 text-gray-400' : 'bg-amber-400 text-white hover:bg-amber-500']">
                {{ sentAlerts.has(fee.id) ? '✓ 已提醒' : '📨 提醒家长' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm p-6">
        <div class="flex items-center gap-2 mb-5">
          <span class="text-2xl">🟡</span>
          <h2 class="text-lg font-bold text-gray-800">7天内到期</h2>
          <span class="text-sm text-gray-400">({{ dueSoonFees.length }})</span>
        </div>
        <div v-if="dueSoonFees.length === 0" class="text-center py-12 text-gray-400">
          <div class="text-5xl mb-3">👍</div><p>近期无需关注</p>
        </div>
        <div class="space-y-3">
          <div v-for="fee in dueSoonFees" :key="fee.id" class="p-4 rounded-xl bg-amber-50 border-2 border-amber-200 hover:shadow-md transition-all">
            <div class="flex items-start justify-between mb-2">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-gray-800">{{ fee.studentName }}</span>
                  <span class="text-xs bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full font-medium">剩余 {{ fee.remainingDays }} 天</span>
                </div>
                <div class="text-sm text-gray-500 mt-1">{{ fee.feeTypeName }} · ¥{{ fee.amount.toLocaleString() }} · 截止 {{ fee.dueDate }}</div>
              </div>
            </div>
            <div class="flex gap-2">
              <button @click="openPay(fee)" class="flex-1 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-sm">💳 缴费</button>
              <button @click="sendReminder(fee.id)" :disabled="sentAlerts.has(fee.id)"
                :class="['flex-1 py-2 text-sm font-bold rounded-xl transition-all shadow-sm', sentAlerts.has(fee.id) ? 'bg-gray-100 text-gray-400' : 'bg-amber-400 text-white hover:bg-amber-500']">
                {{ sentAlerts.has(fee.id) ? '✓ 已提醒' : '📨 提醒家长' }}
              </button>
            </div>
          </div>
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
          <input v-model.number="payAmount" type="number" step="0.01" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-emerald-400" />
        </div>
        <div class="flex gap-3">
          <button @click="showPayModal = false" class="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200">取消</button>
          <button @click="doPay" class="flex-1 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-400/30">确认缴费</button>
        </div>
      </div>
    </div>
  </div>
</template>
