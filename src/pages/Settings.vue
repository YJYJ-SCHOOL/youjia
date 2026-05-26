<script setup>
import { ref } from 'vue'
import { useStore, getFeeTypes, addFeeType, updateFeeType, deleteFeeType, FEE_CATEGORY_LABELS } from '../stores/index.js'

const store = useStore()
const message = ref('')
const messageType = ref('success')

// ----- 用户管理 -----
const adminUsers = ref(store.users.filter(u => u.role === 'admin'))
const teacherUsers = ref(store.users.filter(u => u.role === 'teacher'))
const parentUsers = ref(store.users.filter(u => u.role === 'parent'))
const showUserModal = ref(false)
const userForm = ref({ name: '', phone: '', password: '123456', role: 'teacher' })

function refreshUsers() {
  adminUsers.value = store.users.filter(u => u.role === 'admin')
  teacherUsers.value = store.users.filter(u => u.role === 'teacher')
  parentUsers.value = store.users.filter(u => u.role === 'parent')
}
function openAddUser() { userForm.value = { name: '', phone: '', password: '123456', role: 'teacher' }; showUserModal.value = true }
function addUser() {
  if (!userForm.value.name || !userForm.value.phone) return
  store.users.push({ id: 'u' + (store.users.length + 1), ...userForm.value, avatar: '' })
  saveAndRefresh()
  showUserModal.value = false
  flashMsg('用户添加成功！')
}
function removeUser(id) {
  if (confirm('确定删除该用户？')) {
    store.users = store.users.filter(u => u.id !== id)
    saveAndRefresh()
    flashMsg('用户已删除')
  }
}

// ----- 费用类型管理 -----
const feeTypes = ref([])
const showFeeTypeModal = ref(false)
const editingFeeType = ref(null)
const feeTypeForm = ref({ name: '', category: 'training', teacherId: '', hasHourTracking: false, price: 0, totalHours: 0, description: '' })
const allTeachers = ref(store.users.filter(u => u.role === 'teacher'))

function refreshFeeTypes() {
  feeTypes.value = getFeeTypes()
  allTeachers.value = store.users.filter(u => u.role === 'teacher')
}

function openAddFeeType() {
  editingFeeType.value = null
  feeTypeForm.value = { name: '', category: 'training', teacherId: allTeachers.value[0]?.id || '', hasHourTracking: false, price: 0, totalHours: 0, description: '' }
  showFeeTypeModal.value = true
}

function openEditFeeType(ft) {
  editingFeeType.value = ft
  feeTypeForm.value = { ...ft }
  showFeeTypeModal.value = true
}

function saveFeeType() {
  if (!feeTypeForm.value.name) return
  if (editingFeeType.value) {
    updateFeeType(editingFeeType.value.id, {
      ...feeTypeForm.value,
      price: Number(feeTypeForm.value.price),
      totalHours: Number(feeTypeForm.value.totalHours),
      hasHourTracking: feeTypeForm.value.category === 'training',
    })
  } else {
    addFeeType({
      ...feeTypeForm.value,
      price: Number(feeTypeForm.value.price),
      totalHours: Number(feeTypeForm.value.totalHours),
      hasHourTracking: feeTypeForm.value.category === 'training',
    })
  }
  showFeeTypeModal.value = false
  refreshFeeTypes()
  flashMsg(editingFeeType.value ? '费用类型已更新' : '费用类型已添加')
}

function removeFeeType(id) {
  if (confirm('确定删除该费用类型？')) {
    deleteFeeType(id)
    refreshFeeTypes()
    flashMsg('费用类型已删除')
  }
}

// ----- 通用 -----
function saveAndRefresh() {
  localStorage.setItem('after-school-manager', JSON.stringify(store))
  refreshUsers()
  refreshFeeTypes()
}
function flashMsg(msg, type = 'success') {
  message.value = msg; messageType.value = type
  setTimeout(() => { message.value = '' }, 3000)
}
function resetData() {
  if (confirm('确定要重置所有数据为初始状态吗？此操作不可恢复！')) {
    localStorage.removeItem('after-school-manager')
    location.reload()
  }
}

refreshFeeTypes()
refreshUsers()
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- 消息提示 -->
    <div v-if="message" :class="['fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white font-medium transition-all', messageType === 'success' ? 'bg-emerald-500' : 'bg-rose-500']">
      {{ message }}
    </div>

    <!-- 费用类型管理 -->
    <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-gray-800">🏷️ 费用类型 / 课程管理</h2>
        <button @click="openAddFeeType" class="px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all shadow-sm">＋ 添加类型</button>
      </div>

      <div v-if="feeTypes.length === 0" class="text-center py-8 text-gray-400">暂无自定义费用类型</div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div v-for="ft in feeTypes" :key="ft.id" class="p-4 rounded-xl border-2 hover:shadow-md transition-all"
             :class="ft.category === 'training' ? 'border-violet-200 bg-violet-50/30' : ft.category === 'care' ? 'border-sky-200 bg-sky-50/30' : 'border-orange-200 bg-orange-50/30'">
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="font-bold text-gray-800">{{ ft.name }}</span>
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium',
                ft.category === 'training' ? 'bg-violet-100 text-violet-600' : ft.category === 'care' ? 'bg-sky-100 text-sky-600' : 'bg-orange-100 text-orange-600']">
                {{ FEE_CATEGORY_LABELS[ft.category] }}
              </span>
            </div>
            <div class="flex gap-1">
              <button @click="openEditFeeType(ft)" class="text-xs text-gray-400 hover:text-sky-500 transition-colors">✏️</button>
              <button @click="removeFeeType(ft.id)" class="text-xs text-gray-400 hover:text-rose-500 transition-colors">🗑</button>
            </div>
          </div>
          <div class="space-y-1 text-xs text-gray-500">
            <div>💰 ¥{{ ft.price }} / {{ ft.category === 'training' ? '期' : '月' }}</div>
            <div v-if="ft.hasHourTracking">📅 {{ ft.totalHours }} 课时</div>
            <div>👩‍🏫 {{ allTeachers.find(t => t.id === ft.teacherId)?.name || '未分配' }}</div>
            <div v-if="ft.description" class="text-gray-400">{{ ft.description }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户管理 -->
    <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-gray-800">👥 用户管理</h2>
        <button @click="openAddUser" class="px-4 py-2 bg-sky-500 text-white text-sm font-bold rounded-xl hover:bg-sky-600 transition-all shadow-sm">＋ 添加用户</button>
      </div>
      <div class="space-y-6">
        <div v-for="{ role, users, color, bg } in [{ role: '管理员', users: adminUsers, color: 'bg-amber-100 text-amber-700', bg: 'bg-amber-50' }, { role: '老师', users: teacherUsers, color: 'bg-sky-100 text-sky-700', bg: 'bg-sky-50' }, { role: '家长', users: parentUsers, color: 'bg-emerald-100 text-emerald-700', bg: 'bg-emerald-50' }]" :key="role">
          <h3 class="text-sm font-bold text-gray-400 uppercase mb-2">{{ role }}</h3>
          <div class="space-y-2">
            <div v-for="u in users" :key="u.id" :class="['flex items-center justify-between p-3 rounded-xl', bg]">
              <div><span class="font-medium text-gray-700">{{ u.name }}</span><span class="text-xs text-gray-400 ml-2">{{ u.phone }}</span></div>
              <div class="flex items-center gap-2">
                <span :class="['text-xs px-2 py-0.5 rounded-full', color]">{{ role }}</span>
                <button @click="removeUser(u.id)" class="text-gray-300 hover:text-rose-500 text-sm">×</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <h2 class="text-lg font-bold text-gray-800 mb-4">💾 数据管理</h2>
      <div class="flex items-center justify-between p-4 rounded-xl bg-gray-50">
        <div>
          <div class="font-medium text-gray-700">重置数据</div>
          <div class="text-xs text-gray-400">删除所有数据并恢复初始演示数据</div>
        </div>
        <button @click="resetData" class="px-4 py-2 bg-rose-500 text-white text-sm font-bold rounded-xl hover:bg-rose-600 transition-all shadow-sm">重置</button>
      </div>
      <div class="flex items-center justify-between p-4 rounded-xl bg-gray-50 mt-3">
        <div>
          <div class="font-medium text-gray-700">当前数据</div>
          <div class="text-xs text-gray-400">
            用户 {{ store.users?.length || 0 }} · 学生 {{ store.students?.length || 0 }} ·
            费用类型 {{ store.feeTypes?.length || 0 }} · 费用 {{ store.fees?.length || 0 }} ·
            请假 {{ store.leaves?.length || 0 }} · 反馈 {{ store.feedbacks?.length || 0 }}
          </div>
        </div>
      </div>
    </div>

    <!-- 关于 -->
    <div class="bg-white rounded-2xl shadow-sm p-6">
      <h2 class="text-lg font-bold text-gray-800 mb-4">ℹ️ 关于</h2>
      <div class="text-sm text-gray-500 space-y-2">
        <p><strong>优家优漖成长中心管理系统</strong> v1.0</p>
        <p>支持自定义费用类型、课时追踪、请假管理（补班/退费）、阶段性反馈。</p>
        <p class="text-xs text-gray-400 mt-4">数据存储在浏览器本地。管理员拥有全部权限，老师管理自己的班级并写反馈（按课程分类），家长查看自己孩子的费用、反馈和请假记录。</p>
      </div>
    </div>

    <!-- 添加用户弹窗 -->
    <div v-if="showUserModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" @click.self="showUserModal = false">
      <div class="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm mx-4">
        <h2 class="text-xl font-bold text-gray-800 mb-4">添加用户</h2>
        <div class="space-y-3">
          <div><label class="block text-sm font-medium text-gray-600 mb-1">姓名</label><input v-model="userForm.name" type="text" placeholder="请输入姓名" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-sky-400" /></div>
          <div><label class="block text-sm font-medium text-gray-600 mb-1">手机号</label><input v-model="userForm.phone" type="text" placeholder="请输入手机号" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-sky-400" /></div>
          <div><label class="block text-sm font-medium text-gray-600 mb-1">角色</label><select v-model="userForm.role" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 outline-none focus:border-sky-400"><option value="teacher">老师</option><option value="parent">家长</option></select></div>
        </div>
        <div class="flex gap-3 mt-5">
          <button @click="showUserModal = false" class="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200">取消</button>
          <button @click="addUser" class="flex-1 py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg transition-all">确认添加</button>
        </div>
      </div>
    </div>

    <!-- 费用类型弹窗 -->
    <div v-if="showFeeTypeModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" @click.self="showFeeTypeModal = false">
      <div class="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold text-gray-800 mb-5">{{ editingFeeType ? '编辑费用类型' : '添加费用类型' }}</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">名称</label>
            <input v-model="feeTypeForm.name" type="text" placeholder="如：寒假班、晚托、语文培训班..."
              class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-amber-400" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">类别</label>
            <select v-model="feeTypeForm.category" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 outline-none focus:border-amber-400">
              <option value="training">培训班（需记录课时）</option>
              <option value="care">托管</option>
              <option value="meal">餐费</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">负责老师</label>
            <select v-model="feeTypeForm.teacherId" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 outline-none focus:border-amber-400">
              <option value="">不分配老师</option>
              <option v-for="t in allTeachers" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-600 mb-1">价格 (元)</label>
              <input v-model.number="feeTypeForm.price" type="number" step="0.01" placeholder="0"
                class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-amber-400" />
            </div>
            <div v-if="feeTypeForm.category === 'training'">
              <label class="block text-sm font-medium text-gray-600 mb-1">总课时</label>
              <input v-model.number="feeTypeForm.totalHours" type="number" placeholder="如：32"
                class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-amber-400" />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">描述</label>
            <input v-model="feeTypeForm.description" type="text" placeholder="简短描述..."
              class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-amber-400" />
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showFeeTypeModal = false" class="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200">取消</button>
          <button @click="saveFeeType" class="flex-1 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all">
            {{ editingFeeType ? '保存修改' : '确认添加' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
