<!-- src/components/FallbackPage.vue -->
<template>
  <div class="fallback-page">
    <h1>Welcome to YouTube Creator Campaign Planner</h1>
    <p>This is a fallback page to test routing</p>
    <div class="links">
      <router-link to="/home" class="nav-link">Go to Home</router-link>
      <router-link to="/api-status" class="nav-link">Check API Status</router-link>
      <router-link to="/saved-campaigns" class="nav-link">View Saved Campaigns</router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FallbackPage'
}
</script>

<style scoped>
.fallback-page {
  max-width: 600px;
  margin: 100px auto;
  padding: 20px;
  text-align: center;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  color: var(--primary-color);
  margin-bottom: 20px;
}

p {
  color: var(--dark-gray);
  margin-bottom: 30px;
}

.links {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.nav-link {
  display: inline-block;
  padding: 10px 20px;
  background-color: var(--primary-color);
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.nav-link:hover {
  background-color: #cc0000;
}
</style> 