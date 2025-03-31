import { createRouter, createWebHistory } from 'vue-router';

// Use lazy loading for better performance
const Home = () => import('../components/Home.vue');
const SavedCampaigns = () => import('../components/SavedCampaigns.vue');
const GeminiApiStatus = () => import('../components/GeminiApiStatus.vue');
const FallbackPage = () => import('../components/FallbackPage.vue');

const routes = [
  {
    path: '/',
    redirect: '/home' // Redirect to home directly instead of handling in component
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: {
      title: 'Home - YouTube Creator Campaign'
    }
  },
  {
    path: '/saved-campaigns',
    name: 'SavedCampaigns',
    component: SavedCampaigns,
    meta: {
      title: 'Saved Campaigns - YouTube Creator Campaign'
    }
  },
  {
    path: '/api-status',
    name: 'ApiStatus',
    component: GeminiApiStatus,
    meta: {
      title: 'API Status - YouTube Creator Campaign'
    }
  },
  // Catch-all route for 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: FallbackPage,
    meta: {
      title: 'Page Not Found'
    }
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 }; // Scroll to top on route change
    }
  }
});

// Update page title based on route meta
router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'YouTube Creator Campaign';
  next();
});

export default router; 