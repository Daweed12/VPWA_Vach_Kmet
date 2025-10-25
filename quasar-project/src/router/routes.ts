import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/LoginRegisterLayout.vue'),
    children: [
      { path: '', component: () => import('pages/LoginRegisterPage.vue') }
    ],
  },
  {
    path: '/app',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'chat',
        component: () => import('pages/IndexPage.vue'),
        meta: { showComposer: true, showRightDrawer: true }
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('pages/SettingsPage.vue'),
        meta: { showComposer: false, showRightDrawer: false }
      }
    ],
  },

  { path: '/:catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue') },
]

export default routes
