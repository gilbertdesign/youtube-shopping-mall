// main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

// Create and mount the Vue application
const app = createApp(App);

// Use router
app.use(router);

// Provide global config for Google AI API key
// This allows components to access it via getCurrentInstance()
app.config.globalProperties.$googleApiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY || '';

// Mount app
app.mount('#app');