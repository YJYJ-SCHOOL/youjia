import { createRouter, createWebHashHistory } from 'vue-router'
import { isLoggedIn, getCurrentUser } from '../stores/index.js'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../pages/Login.vue'), meta: { guest: true } },
  {
    path: '/',
    component: () => import('../components/AppLayout.vue'),
    children: [
      { path: '', name: 'Dashboard', component: () => import('../pages/Dashboard.vue') },
      { path: 'students', name: 'Students', component: () => import('../pages/Students.vue'), meta: { roles: ['admin', 'teacher'] } },
      { path: 'students/:id', name: 'StudentDetail', component: () => import('../pages/StudentDetail.vue'), props: true },
      { path: 'fees', name: 'Fees', component: () => import('../pages/Fees.vue'), meta: { roles: ['admin'] } },
      { path: 'fees/alerts', name: 'FeeAlerts', component: () => import('../pages/FeeAlerts.vue'), meta: { roles: ['admin'] } },
      { path: 'feedback', name: 'Feedback', component: () => import('../pages/Feedback.vue'), meta: { roles: ['admin', 'teacher'] } },
      { path: 'feedback/:studentId', name: 'StudentFeedback', component: () => import('../pages/StudentFeedback.vue'), props: true },
      { path: 'leaves', name: 'Leaves', component: () => import('../pages/Leaves.vue'), meta: { roles: ['admin', 'teacher'] } },
      { path: 'settings', name: 'Settings', component: () => import('../pages/Settings.vue'), meta: { roles: ['admin'] } },
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta.guest) return next()
  if (!isLoggedIn()) return next('/login')
  const user = getCurrentUser()
  if (to.meta.roles && !to.meta.roles.includes(user?.role)) return next('/')
  next()
})

export default router
