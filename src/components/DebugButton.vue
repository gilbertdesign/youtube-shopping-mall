<!-- src/components/DebugButton.vue -->
<template>
    <div class="debug-container">
      <button @click="toggleDebug" class="debug-btn">
        {{ showDebug ? 'Hide Debug Info' : 'Show Debug Info' }}
      </button>
      
      <div v-if="showDebug" class="debug-info">
        <h4>Debug Information</h4>
        <pre>{{ debugJson }}</pre>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed } from 'vue';
  
  export default {
    name: 'DebugButton',
    props: {
      data: {
        type: Object,
        required: true
      }
    },
    setup(props) {
      const showDebug = ref(false);
      
      const debugJson = computed(() => {
        try {
          return JSON.stringify(props.data, null, 2);
        } catch (error) {
          return `Error stringifying data: ${error.message}`;
        }
      });
      
      const toggleDebug = () => {
        showDebug.value = !showDebug.value;
      };
      
      return {
        showDebug,
        toggleDebug,
        debugJson
      };
    }
  };
  </script>
  
  <style scoped>
  .debug-container {
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px dashed #ddd;
  }
  
  .debug-btn {
    padding: 8px 12px;
    background-color: #6c757d;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
  }
  
  .debug-btn:hover {
    background-color: #5a6268;
  }
  
  .debug-info {
    margin-top: 10px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #e9ecef;
    overflow-x: auto;
  }
  
  .debug-info h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #495057;
    font-size: 14px;
  }
  
  .debug-info pre {
    margin: 0;
    font-family: monospace;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
  }
  </style>