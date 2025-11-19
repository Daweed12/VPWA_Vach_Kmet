import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  // AUTH layout + login page
  {
    path: '/auth',
    component: () => import('layouts/LoginRegisterLayout.vue'),
    children: [
      {
        path: 'login',
        component: () => import('pages/LoginRegisterPage.vue'),
      },
    ],
  },

  // APP layout – hlavná aplikácia
  {
    path: '/app',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue'), // alebo tvoja hlavná stránka
      },
    ],
  },

  // redirect root -> login
  {
    path: '/',
    redirect: '/auth/login',
  },

  // 404 fallback
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
