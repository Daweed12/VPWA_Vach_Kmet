import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/LoginRegisterLayout.vue'),
    children: [
      { path: '', component: () => import('pages/LoginRegisterPage.vue') }
    ],
  },

  // ✅ Jeden spoločný layout pre celé /app
  {
    path: '/app',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'chat',
        component: () => import('pages/IndexPage.vue'),
        meta: { showComposer: true, showRightDrawer: true }   // chat
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('pages/SettingsPage.vue'),
        meta: { showComposer: false, showRightDrawer: false } // settings
      }
    ],
  },

  { path: '/:catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue') },
];

export default routes;
