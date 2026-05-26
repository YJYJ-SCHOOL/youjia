import { reactive, ref } from 'vue'

const STORAGE_KEY = 'after-school-manager'

const defaultData = {
  users: [
    { id: 'u1', name: '张校长', role: 'admin', phone: '13800000001', password: '123456', avatar: '' },
    { id: 'u2', name: '李老师', role: 'teacher', phone: '13800000002', password: '123456', avatar: '' },
    { id: 'u3', name: '王老师', role: 'teacher', phone: '13800000003', password: '123456', avatar: '' },
    { id: 'u4', name: '赵爸爸', role: 'parent', phone: '13800000004', password: '123456', avatar: '' },
    { id: 'u5', name: '钱妈妈', role: 'parent', phone: '13800000005', password: '123456', avatar: '' },
  ],

  // 自定义费用类型/课程类型
  feeTypes: [
    { id: 'ft1', name: '午托', category: 'care', teacherId: 'u2', hasHourTracking: false, price: 800, description: '中午放学后托管，含午餐' },
    { id: 'ft2', name: '晚托', category: 'care', teacherId: 'u2', hasHourTracking: false, price: 1200, description: '下午放学后托管至18:30，含晚餐' },
    { id: 'ft3', name: '餐费', category: 'meal', teacherId: '', hasHourTracking: false, price: 600, description: '每月餐费（午餐+晚餐）' },
    { id: 'ft4', name: '寒假班', category: 'training', teacherId: 'u3', hasHourTracking: true, price: 2800, totalHours: 40, description: '寒假全天托管+辅导' },
    { id: 'ft5', name: '暑假班', category: 'training', teacherId: 'u3', hasHourTracking: true, price: 4800, totalHours: 80, description: '暑假全天托管+辅导' },
    { id: 'ft6', name: '语文培训班', category: 'training', teacherId: 'u2', hasHourTracking: true, price: 1500, totalHours: 32, description: '阅读写作专项提升' },
    { id: 'ft7', name: '数学培训班', category: 'training', teacherId: 'u3', hasHourTracking: true, price: 1500, totalHours: 32, description: '数学思维训练' },
    { id: 'ft8', name: '英语培训班', category: 'training', teacherId: 'u2', hasHourTracking: true, price: 1800, totalHours: 32, description: '英语听说读写综合' },
  ],

  students: [
    { id: 's1', name: '张小明', grade: '三年级', parentId: 'u4', teacherId: 'u2', enrollmentDate: '2025-09-01', status: 'active' },
    { id: 's2', name: '李小红', grade: '四年级', parentId: 'u5', teacherId: 'u2', enrollmentDate: '2025-09-01', status: 'active' },
    { id: 's3', name: '王大力', grade: '二年级', parentId: 'u4', teacherId: 'u3', enrollmentDate: '2025-12-01', status: 'active' },
    { id: 's4', name: '陈小花', grade: '五年级', parentId: 'u5', teacherId: 'u3', enrollmentDate: '2026-02-15', status: 'active' },
    { id: 's5', name: '刘小宇', grade: '三年级', parentId: 'u4', teacherId: 'u2', enrollmentDate: '2025-09-01', status: 'active' },
  ],

  // 费用记录：feeTypeId 关联费用类型
  fees: [
    { id: 'f1', studentId: 's1', feeTypeId: 'ft2', amount: 1200, dueDate: '2026-05-01', paidDate: '', paidAmount: 0, status: 'overdue', totalHours: 0, attendedHours: 0 },
    { id: 'f2', studentId: 's1', feeTypeId: 'ft3', amount: 600, dueDate: '2026-05-01', paidDate: '2026-04-28', paidAmount: 600, status: 'paid', totalHours: 0, attendedHours: 0 },
    { id: 'f3', studentId: 's2', feeTypeId: 'ft6', amount: 1500, dueDate: '2026-06-01', paidDate: '', paidAmount: 0, status: 'pending', totalHours: 32, attendedHours: 12 },
    { id: 'f4', studentId: 's2', feeTypeId: 'ft2', amount: 1200, dueDate: '2026-06-01', paidDate: '', paidAmount: 0, status: 'pending', totalHours: 0, attendedHours: 0 },
    { id: 'f5', studentId: 's3', feeTypeId: 'ft7', amount: 1500, dueDate: '2026-05-01', paidDate: '2026-04-15', paidAmount: 1500, status: 'paid', totalHours: 32, attendedHours: 10 },
    { id: 'f6', studentId: 's3', feeTypeId: 'ft1', amount: 800, dueDate: '2026-04-15', paidDate: '', paidAmount: 0, status: 'overdue', totalHours: 0, attendedHours: 0 },
    { id: 'f7', studentId: 's4', feeTypeId: 'ft8', amount: 1800, dueDate: '2026-06-01', paidDate: '', paidAmount: 0, status: 'pending', totalHours: 32, attendedHours: 8 },
    { id: 'f8', studentId: 's5', feeTypeId: 'ft1', amount: 800, dueDate: '2026-05-01', paidDate: '2026-05-03', paidAmount: 500, status: 'partial', totalHours: 0, attendedHours: 0 },
    { id: 'f9', studentId: 's5', feeTypeId: 'ft3', amount: 600, dueDate: '2026-05-01', paidDate: '', paidAmount: 0, status: 'overdue', totalHours: 0, attendedHours: 0 },
  ],

  // 请假记录
  leaves: [
    { id: 'l1', studentId: 's3', feeId: 'f5', date: '2026-04-20', reason: '感冒发烧', status: 'makeup', makeupDate: '2026-04-27', note: '已安排补课' },
    { id: 'l2', studentId: 's2', feeId: 'f3', date: '2026-05-10', reason: '家里有事', status: 'pending', makeupDate: '', note: '' },
    { id: 'l3', studentId: 's4', feeId: 'f7', date: '2026-05-05', reason: '参加学校活动', status: 'refunded', makeupDate: '', note: '已退1课时费用' },
  ],

  // 反馈记录：新增 feeTypeId 关联课程
  feedbacks: [
    { id: 'fb1', studentId: 's1', teacherId: 'u2', feeTypeId: 'ft2', period: '2026年4月', category: 'academic', rating: 3, content: '晚托期间作业完成质量有提升，但数学应用题理解还需加强。', createdAt: '2026-04-28' },
    { id: 'fb2', studentId: 's1', teacherId: 'u2', feeTypeId: 'ft2', period: '2026年4月', category: 'behavior', rating: 4, content: '纪律表现良好，能够主动帮助低年级同学。', createdAt: '2026-04-28' },
    { id: 'fb3', studentId: 's2', teacherId: 'u2', feeTypeId: 'ft6', period: '2026年4月', category: 'academic', rating: 5, content: '语文阅读能力突出，作文表达流畅、想象力丰富。继续保持阅读量！', createdAt: '2026-04-25' },
    { id: 'fb4', studentId: 's3', teacherId: 'u3', feeTypeId: 'ft7', period: '2026年4月', category: 'academic', rating: 3, content: '数学基础运算有进步，但几何空间想象能力还需要加强。', createdAt: '2026-04-26' },
    { id: 'fb5', studentId: 's4', teacherId: 'u3', feeTypeId: 'ft8', period: '2026年3月', category: 'academic', rating: 4, content: '英语口语表达自信心增强，词汇量有明显增长。', createdAt: '2026-03-30' },
    { id: 'fb6', studentId: 's5', teacherId: 'u2', feeTypeId: 'ft1', period: '2026年4月', category: 'social', rating: 4, content: '午托期间与同学相处融洽，学会主动分享。', createdAt: '2026-04-22' },
  ],

  nextId: { user: 6, student: 6, fee: 10, feedback: 7, feeType: 9, leave: 4 }
}

// ---------- 数据加载 ----------

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      // 数据迁移：确保新字段存在
      if (!data.feeTypes) data.feeTypes = defaultData.feeTypes
      if (!data.leaves) data.leaves = defaultData.leaves
      return data
    }
  } catch { /* ignore */ }
  return JSON.parse(JSON.stringify(defaultData))
}

const state = reactive(loadData())

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function genId(prefix) {
  state.nextId[prefix] = (state.nextId[prefix] || 1) + 1
  save()
  return prefix.slice(0, 1) + state.nextId[prefix]
}

// ---------- 导出 ----------

export function useStore() {
  return state
}

// ---------- 认证 ----------

let currentUserId = ref(null)

export function login(phone, password) {
  const user = state.users.find(u => u.phone === phone && u.password === password)
  if (user) {
    currentUserId.value = user.id
    localStorage.setItem('current-user', user.id)
  }
  return user
}

export function logout() {
  currentUserId.value = null
  localStorage.removeItem('current-user')
}

export function getCurrentUser() {
  if (!currentUserId.value) {
    const saved = localStorage.getItem('current-user')
    if (saved) currentUserId.value = saved
  }
  return state.users.find(u => u.id === currentUserId.value) || null
}

export function isLoggedIn() {
  return !!getCurrentUser()
}

// ---------- 费用类型 ----------

export function getFeeTypes(filter = {}) {
  let list = [...state.feeTypes]
  if (filter.category) list = list.filter(ft => ft.category === filter.category)
  if (filter.teacherId) list = list.filter(ft => ft.teacherId === filter.teacherId)
  return list
}

export function getFeeTypeById(id) {
  return state.feeTypes.find(ft => ft.id === id)
}

export function addFeeType(data) {
  const ft = { id: genId('feeType'), ...data }
  state.feeTypes.push(ft)
  save()
  return ft
}

export function updateFeeType(id, data) {
  const idx = state.feeTypes.findIndex(ft => ft.id === id)
  if (idx > -1) { state.feeTypes[idx] = { ...state.feeTypes[idx], ...data }; save() }
}

export function deleteFeeType(id) {
  state.feeTypes = state.feeTypes.filter(ft => ft.id !== id)
  save()
}

// ---------- 学生 ----------

export function getStudents() {
  return state.students
}

export function addStudent(data) {
  const s = { id: genId('student'), ...data, status: 'active' }
  state.students.push(s)
  save()
  return s
}

export function updateStudent(id, data) {
  const idx = state.students.findIndex(s => s.id === id)
  if (idx > -1) { state.students[idx] = { ...state.students[idx], ...data }; save() }
}

export function deleteStudent(id) {
  state.students = state.students.filter(s => s.id !== id)
  save()
}

export function getStudentById(id) {
  return state.students.find(s => s.id === id)
}

export function getMyChildren(parentId) {
  return state.students.filter(s => s.parentId === parentId)
}

// ---------- 费用 ----------

export function getFees(filter = {}) {
  let list = [...state.fees]
  if (filter.studentId) list = list.filter(f => f.studentId === filter.studentId)
  if (filter.status) list = list.filter(f => f.status === filter.status)
  if (filter.feeTypeId) list = list.filter(f => f.feeTypeId === filter.feeTypeId)
  return list.sort((a, b) => b.dueDate.localeCompare(a.dueDate))
}

export function addFee(data) {
  const ft = getFeeTypeById(data.feeTypeId)
  const f = {
    id: genId('fee'),
    paidDate: '', paidAmount: 0, status: 'pending',
    totalHours: ft?.hasHourTracking ? (ft.totalHours || 0) : 0,
    attendedHours: 0,
    ...data
  }
  state.fees.push(f)
  save()
  return f
}

export function updateFee(id, data) {
  const idx = state.fees.findIndex(f => f.id === id)
  if (idx > -1) { state.fees[idx] = { ...state.fees[idx], ...data }; save() }
}

export function deleteFee(id) {
  state.fees = state.fees.filter(f => f.id !== id)
  // 同时删除关联的请假记录
  state.leaves = state.leaves.filter(l => l.feeId !== id)
  save()
}

export function markFeePaid(id, amount) {
  const idx = state.fees.findIndex(f => f.id === id)
  if (idx > -1) {
    const fee = state.fees[idx]
    fee.paidDate = new Date().toISOString().slice(0, 10)
    fee.paidAmount = (fee.paidAmount || 0) + Number(amount)
    if (fee.paidAmount >= fee.amount) fee.status = 'paid'
    else fee.status = 'partial'
    save()
  }
}

// 记录课时（签到）
export function recordAttendance(feeId, hours = 1) {
  const idx = state.fees.findIndex(f => f.id === feeId)
  if (idx > -1) {
    state.fees[idx].attendedHours = Math.min(
      (state.fees[idx].attendedHours || 0) + hours,
      state.fees[idx].totalHours || 0
    )
    save()
  }
}

export function getOverdueFees() {
  const today = new Date().toISOString().slice(0, 10)
  return state.fees.filter(f => f.status !== 'paid' && f.dueDate < today)
}

export function getDueSoonFees(days = 7) {
  const today = new Date()
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() + days)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  const todayStr = today.toISOString().slice(0, 10)
  return state.fees.filter(f => f.status !== 'paid' && f.status !== 'overdue' && f.dueDate >= todayStr && f.dueDate <= cutoffStr)
}

export function getMonthlyStats() {
  const now = new Date()
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthFees = state.fees.filter(f => f.dueDate.startsWith(month))
  const total = monthFees.reduce((s, f) => s + f.amount, 0)
  const received = monthFees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0)
  const pending = monthFees.filter(f => f.status === 'pending' || f.status === 'partial').length
  return { total, received, pending }
}

// ---------- 请假 ----------

export function getLeaves(filter = {}) {
  let list = [...state.leaves]
  if (filter.studentId) list = list.filter(l => l.studentId === filter.studentId)
  if (filter.feeId) list = list.filter(l => l.feeId === filter.feeId)
  if (filter.status) list = list.filter(l => l.status === filter.status)
  return list.sort((a, b) => b.date.localeCompare(a.date))
}

export function addLeave(data) {
  const l = { id: genId('leave'), ...data }
  state.leaves.push(l)
  save()
  return l
}

export function updateLeave(id, data) {
  const idx = state.leaves.findIndex(l => l.id === id)
  if (idx > -1) { state.leaves[idx] = { ...state.leaves[idx], ...data }; save() }
}

export function deleteLeave(id) {
  state.leaves = state.leaves.filter(l => l.id !== id)
  save()
}

// ---------- 反馈 ----------

export function getFeedbacks(filter = {}) {
  let list = [...state.feedbacks]
  if (filter.studentId) list = list.filter(f => f.studentId === filter.studentId)
  if (filter.teacherId) list = list.filter(f => f.teacherId === filter.teacherId)
  if (filter.category) list = list.filter(f => f.category === filter.category)
  if (filter.feeTypeId) list = list.filter(f => f.feeTypeId === filter.feeTypeId)
  return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function addFeedback(data) {
  const fb = { id: genId('feedback'), createdAt: new Date().toISOString().slice(0, 10), ...data }
  state.feedbacks.push(fb)
  save()
  return fb
}

export function deleteFeedback(id) {
  state.feedbacks = state.feedbacks.filter(f => f.id !== id)
  save()
}

// ---------- 标签映射 ----------

export const FEE_STATUS_LABELS = { pending: '待缴', paid: '已缴', overdue: '逾期', partial: '部分' }
export const FEE_CATEGORY_LABELS = { training: '培训班', care: '托管', meal: '餐费' }
export const CATEGORY_LABELS = { academic: '学业', behavior: '行为', social: '社交', health: '健康' }
export const LEAVE_STATUS_LABELS = { pending: '待处理', makeup: '已补课', refunded: '已退费' }
