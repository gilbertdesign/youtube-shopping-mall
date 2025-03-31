<!-- ErrorBoundary.vue -->
<template>
  <div>
    <div v-if="error" class="error-container">
      <div class="error-content">
        <h2>Something went wrong</h2>
        <p>{{ errorMessage }}</p>
        <button @click="resetError" class="retry-button">Try Again</button>
      </div>
    </div>
    <slot v-else></slot>
  </div>
</template>

<script>
export default {
  name: 'ErrorBoundary',
  data() {
    return {
      error: null,
      errorInfo: null
    };
  },
  computed: {
    errorMessage() {
      return this.error?.message || 'An unexpected error occurred';
    }
  },
  methods: {
    resetError() {
      this.error = null;
      this.errorInfo = null;
      window.location.reload();
    }
  },
  errorCaptured(err, vm, info) {
    this.error = err;
    this.errorInfo = info;
    console.error('Captured error:', err);
    console.info('Error additional info:', info);
    return false; // Prevent the error from propagating further
  }
};
</script>

<style scoped>
.error-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  height: 70vh;
}

.error-content {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  text-align: center;
  max-width: 500px;
}

.error-content h2 {
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.retry-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: 0.75rem 1.5rem;
  font-weight: bold;
  margin-top: 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #e50000;
}
</style> 