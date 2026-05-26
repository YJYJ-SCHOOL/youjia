<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useStore, getStudents, addStudent, updateStudent, deleteStudent, getCurrentUser } from '../stores/index.js'

const router = useRouter()
const store = useStore()
const user = computed(() => getCurrentUser())
const isAdmin = computed(() => user.value?.role === 'admin')
const isTeacher = computed(() => user.value?.role === 'teacher')

// 弹窗相关
const showModal = ref(false)
const editingStudent = ref(null)
const form = ref({ name: '', grade: '一年级', parentId: 'u4', teacherId: 'u2', enrollmentDate: '' })

const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']

// 展开状态：{ 'grade|teacherId': true }
const expandedSections = ref({})

// 老师看到的学生（仅自己负责的）
const myStudents = computed(() => {
  if (isTeacher.value) {
    return getStudents().filter(s => s.teacherId === user.value.id)
  }
  return []
})

// 管理员视图：按年级→老师 组织
const gradeOrg = computed(() => {
  if (!isAdmin.value) return []

  const allStudents = getStudents()
  const teachers = store.users.filter(u => u.role === 'teacher')

  // 找出每个年级有哪些老师（通过学生的 teacherId 关联）
  const gradeMap = {}

  for (const grade of grades) {
    const gradeStudents = allStudents.filter(s => s.grade === grade && s.status === 'active')
    if (gradeStudents.length === 0) continue

    // 按老师分组
    const teacherGroups = {}
    const unassigned = []

    for (const s of gradeStudents) {
      if (s.teacherId) {
        if (!teacherGroups[s.teacherId]) {
          const teacher = teachers.find(t => t.id === s.teacherId)
          teacherGroups[s.teacherId] = { teacher: teacher || { id: s.teacherId, name: '未分配' }, students: [] }
        }
        teacherGroups[s.teacherId].students.push(s)
      } else {
        unassigned.push(s)
      }
    }

    const groups = Object.values(teacherGroups)
    // 按学生数量排序
    groups.sort((a, b) => b.students.length - a.students.length)

    if (groups.length > 0 || unassigned.length > 0) {
      gradeMap[grade] = { groups, unassigned, total: gradeStudents.length }
    }
  }

  return gradeMap
})

// 老师视图：按年级分组自己的学生
const myGradeGroups = computed(() => {
  if (!isTeacher.value) return {}
  const map = {}
  for (const s of myStudents.value) {
    if (!map[s.grade]) map[s.grade] = []
    map[s.grade].push(s)
  }
  return map
})

const allTeachers = computed(() => store.users.filter(u => u.role === 'teacher'))

// 总统计
const totalActive = computed(() => getStudents().filter(s => s.status === 'active').length)
const myTotal = computed(() => myStudents.value.filter(s => s.status === 'active').length)

function toggleSection(grade, teacherId) {
  const key = teacherId ? `${grade}|${teacherId}` : grade
  expandedSections.value[key] = !expandedSections.value[key]
}

function isExpanded(grade, teacherId) {
  const key = teacherId ? `${grade}|${teacherId}` : grade
  return !!expandedSections.value[key]
}

function expandAll() {
  const all = {}
  for (const [grade, data] of Object.entries(gradeOrg.value)) {
    all[grade] = true
    for (const g of data.groups) {
      all[`${grade}|${g.teacher.id}`] = true
    }
  }
  expandedSections.value = all
}

function collapseAll() {
  expandedSections.value = {}
}

function refresh() {
  // 触发 computed 重新计算
}

function openAdd(teacherId, grade) {
  editingStudent.value = null
  form.value = {
    name: '',
    grade: grade || '一年级',
    parentId: 'u4',
    teacherId: teacherId || allTeachers.value[0]?.id || 'u2',
    enrollmentDate: new Date().toISOString().slice(0, 10)
  }
  showModal.value = true
}

function openEdit(s) {
  editingStudent.value = s
  form.value = { name: s.name, grade: s.grade, parentId: s.parentId, teacherId: s.teacherId, enrollmentDate: s.enrollmentDate }
  showModal.value = true
}

function saveStudent() {
  if (!form.value.name) return
  if (editingStudent.value) {
    updateStudent(editingStudent.value.id, form.value)
  } else {
    addStudent(form.value)
  }
  showModal.value = false
  refresh()
}

function removeStudent(id) {
  if (confirm('确定删除该学生？相关的费用和反馈记录也将被清理。')) {
    deleteStudent(id)
    refresh()
  }
}

// 颜色轮换
const gradeColors = {
  '一年级': 'from-rose-400 to-pink-500',
  '二年级': 'from-orange-400 to-amber-500',
  '三年级': 'from-amber-400 to-yellow-500',
  '四年级': 'from-emerald-400 to-green-500',
  '五年级': 'from-sky-400 to-blue-500',
  '六年级': 'from-violet-400 to-purple-500',
}
</script>

<template>
  <div>
    <!-- ========== 管理员视图 ========== -->
    <template v-if="isAdmin">
      <!-- 统计栏 -->
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <button @click="openAdd()" class="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-amber-400/30 hover:shadow-xl active:scale-95 transition-all">
          ＋ 新增学生
        </button>
        <div class="flex gap-2 ml-2">
          <button @click="expandAll" class="px-3 py-1.5 text-xs bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 transition-colors border border-sky-200">展开全部</button>
          <button @click="collapseAll" class="px-3 py-1.5 text-xs bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">收起全部</button>
        </div>
        <span class="text-sm text-gray-400 ml-auto">{{ totalActive }} 名在读学生 · {{ Object.keys(gradeOrg).length }} 个年级</span>
      </div>

      <!-- 按年级→老师 分组 -->
      <div class="space-y-4">
        <div v-for="(data, grade) in gradeOrg" :key="grade" class="bg-white rounded-2xl shadow-sm overflow-hidden">
          <!-- 年级标题栏 -->
          <div
            @click="toggleSection(grade)"
            class="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
            :class="[isExpanded(grade) ? 'border-b border-gray-100' : '']"
          >
            <div class="flex items-center gap-3">
              <div :class="['w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-lg shadow-md', gradeColors[grade] || 'from-gray-400 to-gray-500']">
                📚
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-800">{{ grade }}</h3>
                <p class="text-xs text-gray-400">{{ data.groups.length }} 位老师负责 · {{ data.total }} 名学生</p>
              </div>
            </div>
            <span class="text-gray-400 text-lg transition-transform" :class="isExpanded(grade) ? 'rotate-90' : ''">▶</span>
          </div>

          <!-- 年级下的老师列表 -->
          <div v-if="isExpanded(grade)" class="p-5 pt-2 space-y-3">
            <div v-for="group in data.groups" :key="group.teacher.id">
              <!-- 老师行 -->
              <div
                @click="toggleSection(grade, group.teacher.id)"
                class="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 cursor-pointer hover:bg-amber-50 transition-colors border border-amber-100"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold text-sm">
                    {{ group.teacher.name?.charAt(0) }}
                  </div>
                  <div>
                    <div class="text-sm font-semibold text-gray-700">{{ group.teacher.name }}</div>
                    <div class="text-xs text-gray-400">{{ group.students.length }} 名学生</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button @click.stop="openAdd(group.teacher.id, grade)"
                    class="px-3 py-1.5 text-xs bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors font-medium">
                    ＋ 添加
                  </button>
                  <span class="text-gray-400 text-sm transition-transform" :class="isExpanded(grade, group.teacher.id) ? 'rotate-90' : ''">▶</span>
                </div>
              </div>

              <!-- 老师管理的学生卡片 -->
              <div v-if="isExpanded(grade, group.teacher.id)" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-3 ml-4 pl-4 border-l-2 border-amber-200">
                <div v-for="s in group.students" :key="s.id"
                     class="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group border border-gray-100"
                     :class="s.status === 'inactive' ? 'opacity-60' : ''"
                     @click="router.push(`/students/${s.id}`)">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 flex items-center justify-center text-lg font-bold text-white shadow-sm shrink-0">
                      {{ s.name.charAt(0) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-semibold text-gray-700 truncate">{{ s.name }}</div>
                      <div class="text-xs text-gray-400">入学 {{ s.enrollmentDate }}</div>
                    </div>
                    <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button @click.stop="openEdit(s)" class="p-1 bg-gray-100 rounded text-xs hover:bg-gray-200">✏️</button>
                      <button @click.stop="removeStudent(s.id)" class="p-1 bg-rose-50 rounded text-xs hover:bg-rose-100 text-rose-500">🗑</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 无分配学生 -->
            <div v-if="data.unassigned.length > 0" class="ml-4 pl-4 border-l-2 border-gray-200">
              <div class="text-xs text-gray-400 mb-2">未分配老师：</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <div v-for="s in data.unassigned" :key="s.id"
                     class="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group border border-gray-200"
                     @click="router.push(`/students/${s.id}`)">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-lg font-bold text-white shadow-sm shrink-0">
                      {{ s.name.charAt(0) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-semibold text-gray-700 truncate">{{ s.name }}</div>
                      <div class="text-xs text-gray-400">入学 {{ s.enrollmentDate }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ========== 老师视图 ========== -->
    <template v-if="isTeacher">
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-sky-300 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
            {{ user?.name?.charAt(0) }}
          </div>
          <div>
            <h2 class="text-lg font-bold text-gray-800">{{ user?.name }}</h2>
            <p class="text-xs text-gray-400">负责 {{ myTotal }} 名学生 · {{ Object.keys(myGradeGroups).length }} 个年级</p>
          </div>
        </div>
        <button @click="openAdd(user?.id)" class="ml-auto px-5 py-2.5 bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-sky-400/30 hover:shadow-xl active:scale-95 transition-all">
          ＋ 新增学生
        </button>
      </div>

      <!-- 按年级分组我的学生 -->
      <div v-if="Object.keys(myGradeGroups).length === 0" class="text-center py-20 text-gray-400">
        <div class="text-6xl mb-4">📋</div>
        <p class="text-lg">还没有负责的学生</p>
        <p class="text-sm mt-1">点击上方按钮添加学生到您的班级</p>
      </div>

      <div v-else class="space-y-6">
        <div v-for="(students, grade) in myGradeGroups" :key="grade">
          <div class="flex items-center gap-3 mb-3">
            <div :class="['w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-sm shadow-sm', gradeColors[grade] || 'from-gray-400 to-gray-500']">
              🎒
            </div>
            <h3 class="text-base font-bold text-gray-700">{{ grade }} <span class="text-sm font-normal text-gray-400">· {{ students.length }} 人</span></h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div v-for="s in students" :key="s.id"
                 class="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group border border-gray-100"
                 :class="s.status === 'inactive' ? 'opacity-60' : ''"
                 @click="router.push(`/students/${s.id}`)">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-sky-300 to-blue-400 flex items-center justify-center text-lg font-bold text-white shadow-sm shrink-0">
                  {{ s.name.charAt(0) }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-semibold text-gray-700 truncate">{{ s.name }}</div>
                  <div class="text-xs text-gray-400">入学 {{ s.enrollmentDate }}</div>
                </div>
                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button @click.stop="openEdit(s)" class="p-1 bg-gray-100 rounded text-xs hover:bg-gray-200">✏️</button>
                  <button @click.stop="removeStudent(s.id)" class="p-1 bg-rose-50 rounded text-xs hover:bg-rose-100 text-rose-500">🗑</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showModal" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center" @click.self="showModal = false">
      <div class="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold text-gray-800 mb-5">{{ editingStudent ? '编辑学生' : '新增学生' }}</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">姓名</label>
            <input v-model="form.name" type="text" placeholder="请输入学生姓名"
              class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-amber-400" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">年级</label>
            <select v-model="form.grade" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 outline-none focus:border-amber-400">
              <option v-for="g in grades" :key="g" :value="g">{{ g }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">负责老师</label>
            <select v-model="form.teacherId" class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 outline-none focus:border-amber-400">
              <option v-for="t in allTeachers" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-600 mb-1">入学日期</label>
            <input v-model="form.enrollmentDate" type="date"
              class="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 outline-none focus:border-amber-400" />
          </div>
        </div>
        <div class="flex gap-3 mt-6">
          <button @click="showModal = false" class="flex-1 py-2.5 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200">取消</button>
          <button @click="saveStudent" class="flex-1 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all">
            {{ editingStudent ? '保存修改' : '确认添加' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
