<!-- src/components/GeminiApiStatus.vue -->
<template>
    <div class="api-status">
      <h3>Gemini API Status</h3>
      
      <div class="status-panel">
        <div class="status-item">
          <span class="status-label">API Key:</span>
          <span 
            class="status-value" 
            :class="{ 'status-success': hasApiKey, 'status-error': !hasApiKey }"
          >
            {{ hasApiKey ? 'Available' : 'Missing' }}
          </span>
        </div>
        
        <div class="status-item">
          <span class="status-label">API Status:</span>
          <span 
            class="status-value" 
            :class="{
              'status-success': apiStatus === 'connected',
              'status-warning': apiStatus === 'checking',
              'status-error': apiStatus === 'failed'
            }"
          >
            {{ apiStatusText }}
          </span>
        </div>
        
        <div class="status-actions">
          <button @click="checkApiStatus" class="check-btn" :disabled="isChecking">
            {{ isChecking ? 'Checking...' : 'Check API Connection' }}
          </button>
        </div>
      </div>
      
      <div class="api-message" v-if="message">
        {{ message }}
      </div>
      
      <div class="api-settings" v-if="showSettings">
        <h4>API Settings</h4>
        <div class="form-group">
          <label for="apiKey">API Key:</label>
          <div class="api-key-input">
            <input 
              type="password" 
              id="apiKey" 
              v-model="apiKeyInput"
              placeholder="Enter your Google AI API key"
            />
            <button @click="saveApiKey" class="save-key-btn">Save</button>
          </div>
          <p class="api-key-info">
            Get your API key from <a href="https://ai.google.dev/" target="_blank">Google AI Studio</a>
          </p>
        </div>
      </div>
      
      <div class="api-toggle">
        <button @click="toggleSettings" class="toggle-btn">
          {{ showSettings ? 'Hide Settings' : 'Show Settings' }}
        </button>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted, getCurrentInstance } from 'vue';
  
  export default {
    name: 'GeminiApiStatus',
    setup() {
      const instance = getCurrentInstance();
      const apiKey = ref('');
      const apiKeyInput = ref('');
      const hasApiKey = ref(false);
      const apiStatus = ref('unknown');
      const message = ref('');
      const isChecking = ref(false);
      const showSettings = ref(false);
      
      // Computed property for API status text
      const apiStatusText = computed(() => {
        switch (apiStatus.value) {
          case 'connected':
            return 'Connected';
          case 'checking':
            return 'Checking connection...';
          case 'failed':
            return 'Connection failed';
          default:
            return 'Not checked';
        }
      });
      
      onMounted(() => {
        // Get API key from app config
        const appApiKey = instance?.appContext.config.globalProperties.$googleApiKey;
        
        // Or check localStorage
        const storedApiKey = localStorage.getItem('geminiApiKey');
        
        if (appApiKey) {
          apiKey.value = appApiKey;
          hasApiKey.value = true;
        } else if (storedApiKey) {
          apiKey.value = storedApiKey;
          hasApiKey.value = true;
          
          // If key is in localStorage but not in app config, add it to app config
          if (instance?.appContext.config.globalProperties) {
            instance.appContext.config.globalProperties.$googleApiKey = storedApiKey;
          }
        }
      });
      
      const checkApiStatus = async () => {
        if (!hasApiKey.value) {
          message.value = 'Please enter an API key in the settings first.';
          showSettings.value = true;
          return;
        }
        
        message.value = '';
        isChecking.value = true;
        apiStatus.value = 'checking';
        
        try {
          // Import the GoogleGenerativeAI package
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(apiKey.value);
          const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
          
          // Make a simple test request
          const testPrompt = 'Respond with "API connection successful" if you can read this message.';
          const result = await model.generateContent(testPrompt);
          const text = result.response.text();
          
          if (text.includes('API connection successful') || text.includes('connection')) {
            apiStatus.value = 'connected';
            message.value = 'Successfully connected to Google Gemini API!';
          } else {
            apiStatus.value = 'failed';
            message.value = 'Received unexpected response from API. Please check your API key.';
          }
        } catch (error) {
          console.error('API connection test failed:', error);
          apiStatus.value = 'failed';
          
          if (error.message?.includes('API key')) {
            message.value = 'Invalid API key. Please check your key and try again.';
          } else if (error.message?.includes('CORS')) {
            message.value = 'CORS error. The API may not be accessible from your browser directly.';
          } else {
            message.value = `Connection failed: ${error.message}`;
          }
        } finally {
          isChecking.value = false;
        }
      };
      
      const saveApiKey = () => {
        if (!apiKeyInput.value) {
          message.value = 'Please enter a valid API key.';
          return;
        }
        
        apiKey.value = apiKeyInput.value;
        hasApiKey.value = true;
        
        // Store in localStorage
        localStorage.setItem('geminiApiKey', apiKeyInput.value);
        
        // Update app config
        if (instance?.appContext.config.globalProperties) {
          instance.appContext.config.globalProperties.$googleApiKey = apiKeyInput.value;
        }
        
        message.value = 'API key saved! Please click "Check API Connection" to verify.';
        apiKeyInput.value = '';
        apiStatus.value = 'unknown';
      };
      
      const toggleSettings = () => {
        showSettings.value = !showSettings.value;
      };
      
      return {
        hasApiKey,
        apiStatus,
        apiStatusText,
        message,
        isChecking,
        showSettings,
        apiKeyInput,
        checkApiStatus,
        saveApiKey,
        toggleSettings
      };
    }
  };
  </script>
  
  <style scoped>
  .api-status {
    margin-top: 20px;
    background-color: white;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .api-status h3 {
    margin-bottom: 15px;
    color: #282828;
    border-bottom: 1px solid #eee;
    padding-bottom: 8px;
  }
  
  .status-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    margin-bottom: 15px;
  }
  
  .status-item {
    flex: 1;
    min-width: 120px;
    background-color: #f8f9fa;
    padding: 10px;
    border-radius: 4px;
  }
  
  .status-label {
    font-weight: 500;
    color: #495057;
    margin-right: 5px;
  }
  
  .status-value {
    font-weight: 600;
  }
  
  .status-success {
    color: #28a745;
  }
  
  .status-warning {
    color: #ffc107;
  }
  
  .status-error {
    color: #dc3545;
  }
  
  .status-actions {
    flex: 1;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }
  
  .check-btn {
    padding: 8px 12px;
    background-color: #282828;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s;
  }
  
  .check-btn:hover {
    background-color: #000;
  }
  
  .check-btn:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
  
  .api-message {
    margin: 15px 0;
    padding: 10px;
    background-color: #f8f9fa;
    border-radius: 4px;
    color: #495057;
    font-size: 0.9em;
  }
  
  .api-settings {
    margin-top: 15px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 4px;
  }
  
  .api-settings h4 {
    margin-bottom: 10px;
    color: #343a40;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
  }
  
  .api-key-input {
    display: flex;
    gap: 10px;
  }
  
  .api-key-input input {
    flex: 1;
    padding: 8px;
    border: 1px solid #ced4da;
    border-radius: 4px;
  }
  
  .save-key-btn {
    padding: 8px 12px;
    background-color: #ff0000;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s;
  }
  
  .save-key-btn:hover {
    background-color: #cc0000;
  }
  
  .api-key-info {
    font-size: 0.85em;
    color: #6c757d;
    margin-top: 5px;
  }
  
  .api-key-info a {
    color: #ff0000;
    text-decoration: none;
  }
  
  .api-toggle {
    margin-top: 15px;
    text-align: center;
  }
  
  .toggle-btn {
    padding: 6px 10px;
    background-color: #f8f9fa;
    color: #495057;
    border: 1px solid #ced4da;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.2s;
  }
  
  .toggle-btn:hover {
    background-color: #e9ecef;
  }
  </style>