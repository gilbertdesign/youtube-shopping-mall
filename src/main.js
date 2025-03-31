// main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import config, { getApiKey } from './utils/envConfig';

// Create app instance
const app = createApp(App);

// Configure app
app.use(router);

// Provide global config
app.provide('config', config);
app.config.globalProperties.$config = config;
app.config.globalProperties.$googleApiKey = getApiKey();

// Add global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Global error:', err);
  console.info('Error component:', vm);
  console.info('Error info:', info);
};

// Set performance tracking in development
if (config.isDevelopment) {
  app.config.performance = true;
}

// Mount app
app.mount('#app');

// Log environment info
console.log(`App running in ${config.isDevelopment ? 'development' : 'production'} mode`);
console.log(`API mock mode: ${config.mockEnabled ? 'enabled' : 'disabled'}`);