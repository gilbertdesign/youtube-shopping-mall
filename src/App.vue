<!-- App.vue -->
<template>
  <div class="app">
    <HamburgerMenu />
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>

<script>
import HamburgerMenu from './components/HamburgerMenu.vue';
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';

export default {
  name: 'App',
  components: {
    HamburgerMenu
  },
  setup() {
    const router = useRouter();
    
    onMounted(() => {
      // Redirect to home route if at root path
      if (router.currentRoute.value.path === '/') {
        router.push('/home');
      }
    });
  }
};
</script>

<style>
:root {
  --primary-color: #ff0000;
  --secondary-color: #282828;
  --dark-gray: #606060;
  --light-gray: #f8f9fa;
  --border-radius: 8px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: #333;
  background-color: #f9f9f9;
}

.app {
  min-height: 100vh;
  display: flex;
}

.main-content {
  flex: 1;
  margin-left: 50px;
  padding: 20px;
  transition: margin-left 0.3s ease;
  padding-top: 20px;
}

/* Responsive styles */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 10px;
    padding-top: 60px; /* Add more top padding on mobile to avoid hamburger overlap */
  }
}

/* Global button styles */
button {
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

/* Global link styles */
a {
  color: inherit;
  text-decoration: none;
}

/* Global input styles */
input, textarea, select {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}
</style>