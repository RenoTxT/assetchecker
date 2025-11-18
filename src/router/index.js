// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
// Import 2 halaman yang baru kita buat
import SearchView from '../views/SearchView.vue'
import AssetDetailView from '../views/AssetDetailView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // Ini halaman utama (Home)
      path: '/',
      name: 'search',
      component: SearchView, // Tampilkan halaman pencarian
    },
    {
      // Ini halaman hasil/detail
      // :id adalah parameter dinamis (Asset Number)
      path: '/asset/:id',
      name: 'asset-detail',
      component: AssetDetailView, // Tampilkan halaman detail
    },
  ],
})

export default router
