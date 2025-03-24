import { createRouter, createWebHistory } from 'vue-router';
import Home from '../components/Home.vue';
import SavedCampaigns from '../components/SavedCampaigns.vue';
import GeminiApiStatus from '../components/GeminiApiStatus.vue';
import FallbackPage from '../components/FallbackPage.vue';

const routes = [
  {
    path: '/',
    component: FallbackPage
  },
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
    path: '/saved-campaigns',
    name: 'SavedCampaigns',
    component: SavedCampaigns
  },
  {
    path: '/api-status',
    name: 'ApiStatus',
    component: GeminiApiStatus
  },
  // Catch-all route for 404
  {
    path: '/:pathMatch(.*)*',
    component: FallbackPage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router; 