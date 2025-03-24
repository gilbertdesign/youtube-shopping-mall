<template>
  <div class="hamburger-menu-container">
    <!-- Hamburger icon button -->
    <button 
      class="hamburger-button" 
      @click="toggleMenu"
      :class="{ 'is-open': isOpen }"
    >
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>
    
    <!-- Menu content -->
    <div class="menu-panel" :class="{ 'is-open': isOpen }">
      <nav class="menu-nav">
        <router-link to="/home" class="menu-item" @click="isOpen = false">
          <span class="menu-icon">🏠</span>
          Home
        </router-link>
        <router-link to="/api-status" class="menu-item" @click="isOpen = false">
          <span class="menu-icon">⚙️</span>
          API Status
        </router-link>
        <router-link to="/saved-campaigns" class="menu-item" @click="isOpen = false">
          <span class="menu-icon">📋</span>
          Saved Campaigns
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'HamburgerMenu',
  setup() {
    const isOpen = ref(false);
    const router = useRouter();
    
    const toggleMenu = () => {
      isOpen.value = !isOpen.value;
    };
    
    // Close menu when route changes
    router.beforeEach((to, from, next) => {
      isOpen.value = false;
      next();
    });
    
    return {
      isOpen,
      toggleMenu
    };
  }
};
</script>

<style scoped>
.hamburger-menu-container {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 1000;
}

.hamburger-button {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1001;
  width: 40px;
  height: 40px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  background: white;
  border: none;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.hamburger-button:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.hamburger-line {
  width: 20px;
  height: 2px;
  background-color: #282828;
  transition: all 0.3s ease;
}

.hamburger-button.is-open .hamburger-line:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.hamburger-button.is-open .hamburger-line:nth-child(2) {
  opacity: 0;
}

.hamburger-button.is-open .hamburger-line:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

.menu-panel {
  position: fixed;
  top: 0;
  left: -250px;
  width: 250px;
  height: 100vh;
  background-color: white;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  padding-top: 80px;
  z-index: 999;
}

.menu-panel.is-open {
  left: 0;
}

.menu-nav {
  display: flex;
  flex-direction: column;
  padding: 0 20px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 15px 10px;
  color: #282828;
  text-decoration: none;
  font-weight: 500;
  border-radius: 8px;
  margin-bottom: 5px;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-icon {
  margin-right: 10px;
  font-size: 1.2em;
}

.router-link-active {
  color: #ff0000;
  font-weight: 600;
  background-color: rgba(255, 0, 0, 0.05);
}
</style> 