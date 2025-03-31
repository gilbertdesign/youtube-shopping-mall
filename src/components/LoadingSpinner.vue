<!-- LoadingSpinner.vue -->
<template>
  <div class="spinner-container" :class="{ 'fullscreen': fullscreen }">
    <div class="spinner"></div>
    <p v-if="message" class="message">{{ message }}</p>
  </div>
</template>

<script>
export default {
  name: 'LoadingSpinner',
  props: {
    fullscreen: {
      type: Boolean,
      default: false
    },
    message: {
      type: String,
      default: ''
    }
  }
};
</script>

<style scoped>
.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 9999;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--light-gray);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.message {
  margin-top: 1rem;
  font-size: 1rem;
  color: var(--dark-gray);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 