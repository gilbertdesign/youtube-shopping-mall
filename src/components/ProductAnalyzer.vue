.creator-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .creator-item {
    border: 1px solid #e9ecef;
    border-radius: .mock-note {
    background-color: #fff3cd;
    border: 1px solid #ffeeba;
    padding: 8px 12px;
    border-radius: 4px;
    margin-top: 15px;
  }
  
  .mock-warning {
    color: #856404;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  
  .api-check-btn {
    padding: 3px 8px;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 4px;
    color: #495057;
    font-size: 0.8em;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .api-check-btn:hover {
    background-color: #e9ecef;
  }.analyzer-results {
    animation: fadeIn 0.5s ease-in-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }.analyzer-url {
    margin-top: 10px;
    font-size: 0.9em;
    padding: 8px 12px;
    background-color: #f8f9fa;
    border-radius: 4px;
    border: 1px solid #e9ecef;
    word-break: break-all;
  }
  
  .url-label {
    font-weight: 500;
    color: #495057;
    margin-right: 5px;
  }
  
  .url-value {
    color: #007bff;
    text-decoration: none;
  }
  
  .url-value:hover {
    text-decoration: underline;
  }<!-- src/components/ProductAnalyzer.vue -->
  <template>
    <div class="product-analyzer" v-if="url && url.trim() !== ''">
      <div v-if="isLoading" class="analyzer-loading">
        <div class="loading-animation">
          <div class="dot-pulse"></div>
        </div>
        <p class="loading-title">Analyzing product with AI...</p>
        <p class="loading-detail">Examining URL and extracting marketing insights</p>
      </div>
      
      <div v-else-if="error" class="analyzer-error">
        <div class="error-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <p class="error-message">{{ error }}</p>
        <p class="error-tip">Make sure the URL is valid and points to a product page. If using Gemini AI, check your API key.</p>
        <button @click="retryAnalysis" class="retry-btn">Try Again</button>
      </div>
      
      <div v-else-if="productInfo" class="analyzer-results">
        <h3 :data-source="productInfo.analysisSource === 'gemini' ? 'AI-Powered' : 'Mock Data'">
          Product Analysis
        </h3>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Product Type:</span>
            <span class="info-value">{{ productInfo.extractedInfo.category }}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">Price Range:</span>
            <span class="info-value">{{ productInfo.extractedInfo.estimatedPrice }}</span>
          </div>
          
          <div class="info-item">
            <span class="info-label">Target Audience:</span>
            <span class="info-value">{{ productInfo.extractedInfo.targetDemographic }}</span>
          </div>
        </div>
        
        <div class="info-section">
          <h4>Key Features to Highlight</h4>
          <ul>
            <li v-for="(feature, index) in productInfo.extractedInfo.keyFeatures" :key="'feature-'+index">
              {{ feature }}
            </li>
          </ul>
        </div>
        
        <div class="info-section">
          <h4>Recommended YouTube Creator Categories</h4>
          <ul class="category-list">
            <li v-for="(category, index) in getCreatorCategories(productInfo.extractedInfo)" 
                :key="'category-'+index"
                class="category-item">
              {{ category }}
            </li>
          </ul>
          <p v-if="getCreatorCategories(productInfo.extractedInfo).length === 0" class="empty-message">
            No creator categories available
          </p>
        </div>
        
        <div class="info-section">
          <h4>Suggested Content Styles</h4>
          <ul>
            <li v-for="(style, index) in productInfo.extractedInfo.suggestedContentStyles" :key="'style-'+index">
              {{ style }}
            </li>
          </ul>
        </div>
        
        <p class="analyzer-note" v-if="productInfo.analysisSource === 'gemini'">
          Analysis powered by Google Gemini AI
          <button 
            @click="toggleDebugOutput" 
            class="debug-btn">
            {{ showDebugOutput ? 'Hide Raw Analysis' : 'Show Raw Analysis' }}
          </button>
        </p>
        
        <p class="analyzer-note mock-note" v-else>
          <span class="mock-warning">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            Using sample data - AI analysis unavailable
          </span>
          <button @click="checkApiStatus" class="api-check-btn">Check API Status</button>
        </p>
        
        <div class="analyzer-url" v-if="productInfo.url">
          <span class="url-label">Analyzed URL:</span>
          <a :href="productInfo.url" target="_blank" class="url-value">{{ productInfo.url }}</a>
        </div>
        
        <DebugOutput 
          v-if="productInfo.extractedInfo.rawAnalysis"
          :content="productInfo.extractedInfo.rawAnalysis"
          :showDebug="showDebugOutput"
          @close="hideDebugOutput"
        />
      </div>
    </div>
  </template>
  
  <script>
  import { ref, watch, getCurrentInstance } from 'vue';
  import { fetchProductInfo } from '../utils/apiUtils';
  import DebugOutput from './DebugOutput.vue';
  
  export default {
    name: 'ProductAnalyzer',
    components: {
      DebugOutput
    },
    props: {
      url: {
        type: String,
        default: ''
      }
    },
    emits: ['analysis-complete', 'api-status'],
    setup(props, { emit }) {
      const isLoading = ref(false);
      const error = ref(null);
      const productInfo = ref(null);
      const showDebugOutput = ref(false);
      
      const analyzeProduct = async (url) => {
        if (!url || url.trim() === '') {
          productInfo.value = null;
          error.value = null;
          return;
        }
        
        if (!isValidUrl(url)) {
          error.value = 'Invalid URL format';
          productInfo.value = null;
          emit('analysis-complete', { success: false, error: 'Invalid URL' });
          return;
        }
        
        isLoading.value = true;
        error.value = null;
        
        try {
          // Get API key from app config
          const instance = getCurrentInstance();
          let apiKey = instance?.appContext.config.globalProperties.$googleApiKey || '';
          
          // If not in app config, try localStorage
          if (!apiKey) {
            apiKey = localStorage.getItem('geminiApiKey');
          }
          
          if (!apiKey) {
            console.warn('No Gemini API key found. Please add an API key in the API Status section.');
          }
          
          // Analyze product using Gemini AI
          console.log('Analyzing product URL with Gemini:', url);
          const info = await fetchProductInfo(url, apiKey);
          
          if (info.error) {
            error.value = info.error;
            productInfo.value = null;
            emit('analysis-complete', { success: false, error: info.error });
          } else {
            productInfo.value = info;
            error.value = null;
            emit('analysis-complete', { success: true, data: info });
            
            console.log('Product analysis complete:', info.analysisSource);
            if (info.analysisSource === 'mock') {
              console.warn('Using mock data - no API key or API error occurred');
            }
          }
        } catch (err) {
          console.error('Product analysis error:', err);
          error.value = 'Failed to analyze product';
          productInfo.value = null;
          emit('analysis-complete', { success: false, error: 'Failed to analyze product' });
        } finally {
          isLoading.value = false;
        }
      };
      
      const isValidUrl = (string) => {
        try {
          new URL(string);
          return true;
        } catch (_) {
          return false;
        }
      };
      
      // Toggle debug output display
      const toggleDebugOutput = () => {
        showDebugOutput.value = !showDebugOutput.value;
      };
      
      // Hide debug output
      const hideDebugOutput = () => {
        showDebugOutput.value = false;
      };
      
      // Retry the analysis
      const retryAnalysis = () => {
        if (props.url) {
          analyzeProduct(props.url);
        }
      };
      
      // Check API status and emit event to parent
      const checkApiStatus = () => {
        emit('api-status');
      };
      
      // Watch for URL changes
      watch(() => props.url, (newUrl, oldUrl) => {
        console.log(`URL changed from: "${oldUrl}" to: "${newUrl}"`);
        
        // Only process if the URL is not empty and has actually changed
        if (newUrl && newUrl.trim() !== '' && newUrl !== oldUrl) {
          console.log('Triggering new product analysis for URL:', newUrl);
          
          // Reset previous results
          productInfo.value = null;
          error.value = null;
          showDebugOutput.value = false;
          
          // Start new analysis
          analyzeProduct(newUrl);
        } else if (!newUrl || newUrl.trim() === '') {
          // Clear results if URL is empty
          productInfo.value = null;
          error.value = null;
        }
      }, { immediate: true });
      
      // Force analysis of the current URL
      const forceAnalysis = () => {
        if (props.url) {
          console.log('Force analyzing URL:', props.url);
          // Reset previous results
          productInfo.value = null;
          error.value = null;
          showDebugOutput.value = false;
          
          // Start new analysis
          analyzeProduct(props.url);
        }
      };
      
      // Add this method to the setup function in the script section
      const getCreatorCategories = (extractedInfo) => {
        // If we already have categories, use them
        if (extractedInfo.creatorCategories && Array.isArray(extractedInfo.creatorCategories)) {
          return extractedInfo.creatorCategories;
        }
        
        // If we have creator data but not categories, generate categories based on creators
        if (extractedInfo.recommendedCreators && Array.isArray(extractedInfo.recommendedCreators) && extractedInfo.recommendedCreators.length > 0) {
          // Extract common categories based on product type
          const productType = extractedInfo.category || '';
          
          // Define basic categories based on the product type
          const categories = [];
          
          if (productType.toLowerCase().includes('tech') || productType.toLowerCase().includes('electronics')) {
            categories.push('Tech Reviewers', 'Unboxing Channels', 'Tech Tutorial Creators');
          } else if (productType.toLowerCase().includes('beauty') || productType.toLowerCase().includes('cosmetic')) {
            categories.push('Beauty Influencers', 'Makeup Tutorials', 'Skincare Reviewers');
          } else if (productType.toLowerCase().includes('fitness') || productType.toLowerCase().includes('sport')) {
            categories.push('Fitness Trainers', 'Health & Wellness Channels', 'Active Lifestyle Vloggers');
          } else if (productType.toLowerCase().includes('food') || productType.toLowerCase().includes('cook')) {
            categories.push('Food Reviewers', 'Cooking Channels', 'Culinary Explorers');
          } else {
            // Generic categories
            categories.push(
              'Lifestyle Vloggers', 
              'Product Reviewers', 
              'How-to & Tutorial Creators', 
              'Niche Influencers'
            );
          }
          
          return categories;
        }
        
        return [];
      };
      
      // Expose forceAnalysis to parent
      // Note: defineExpose would be better in Vue 3, but we'll use return for compatibility
      return {
        isLoading,
        error,
        productInfo,
        showDebugOutput,
        toggleDebugOutput,
        hideDebugOutput,
        retryAnalysis,
        checkApiStatus,
        forceAnalysis,
        getCreatorCategories
      };
    }
  };
  </script>
  
  <style scoped>
  .product-analyzer {
    margin-top: 20px;
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 15px;
    border: 1px solid #e9ecef;
  }
  
  .analyzer-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 20px;
    text-align: center;
  }
  
  .loading-title {
    margin: 15px 0 5px;
    font-size: 1.1em;
    font-weight: 500;
    color: #333;
  }
  
  .loading-detail {
    font-size: 0.9em;
    color: #6c757d;
    margin-top: 5px;
  }
  
  .loading-animation {
    margin-bottom: 10px;
  }
  
  /* Dot Pulse Animation */
  .dot-pulse {
    position: relative;
    left: -9999px;
    width: 10px;
    height: 10px;
    border-radius: 5px;
    background-color: #ff0000;
    color: #ff0000;
    box-shadow: 9999px 0 0 -5px;
    animation: dot-pulse 1.5s infinite linear;
    animation-delay: 0.25s;
  }
  
  .dot-pulse::before, .dot-pulse::after {
    content: "";
    display: inline-block;
    position: absolute;
    top: 0;
    width: 10px;
    height: 10px;
    border-radius: 5px;
    background-color: #ff0000;
    color: #ff0000;
  }
  
  .dot-pulse::before {
    box-shadow: 9984px 0 0 -5px;
    animation: dot-pulse-before 1.5s infinite linear;
    animation-delay: 0s;
  }
  
  .dot-pulse::after {
    box-shadow: 10014px 0 0 -5px;
    animation: dot-pulse-after 1.5s infinite linear;
    animation-delay: 0.5s;
  }
  
  @keyframes dot-pulse-before {
    0% {
      box-shadow: 9984px 0 0 -5px;
    }
    30% {
      box-shadow: 9984px 0 0 2px;
    }
    60%, 100% {
      box-shadow: 9984px 0 0 -5px;
    }
  }
  
  @keyframes dot-pulse {
    0% {
      box-shadow: 9999px 0 0 -5px;
    }
    30% {
      box-shadow: 9999px 0 0 2px;
    }
    60%, 100% {
      box-shadow: 9999px 0 0 -5px;
    }
  }
  
  @keyframes dot-pulse-after {
    0% {
      box-shadow: 10014px 0 0 -5px;
    }
    30% {
      box-shadow: 10014px 0 0 2px;
    }
    60%, 100% {
      box-shadow: 10014px 0 0 -5px;
    }
  }
  
  .analyzer-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px;
    border-radius: 8px;
    background-color: #fff3f5;
    border: 1px solid #ffe3e6;
  }
  
  .error-icon {
    color: #dc3545;
    margin-bottom: 10px;
  }
  
  .error-message {
    color: #dc3545;
    font-weight: 500;
    margin-bottom: 8px;
  }
  
  .error-tip {
    font-size: 0.85em;
    color: #6c757d;
    margin: 0 0 15px 0;
    max-width: 80%;
  }
  
  .retry-btn {
    padding: 8px 15px;
    background-color: #f8f9fa;
    border: 1px solid #ced4da;
    border-radius: 4px;
    color: #495057;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .retry-btn:hover {
    background-color: #e9ecef;
  }
  
  .analyzer-results h3 {
    margin-bottom: 15px;
    color: #282828;
    border-bottom: 2px solid #ff0000;
    padding-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .analyzer-results h3::after {
    content: attr(data-source);
    font-size: 0.7em;
    background-color: #ff0000;
    color: white;
    padding: 3px 8px;
    border-radius: 12px;
    font-weight: normal;
  }
  
  .analyzer-results h3[data-source="Mock Data"]::after {
    background-color: #6c757d;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .info-item {
    padding: 8px;
    background-color: white;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  
  .info-label {
    font-weight: 500;
    color: #495057;
    margin-right: 5px;
  }
  
  .info-value {
    color: #212529;
  }
  
  .info-section {
    margin-bottom: 15px;
    background-color: white;
    padding: 12px;
    border-radius: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }
  
  .info-section h4 {
    font-size: 1em;
    margin-bottom: 8px;
    color: #495057;
    padding-bottom: 4px;
    border-bottom: 1px solid #e9ecef;
  }
  
  .info-section ul {
    list-style-type: disc;
    padding-left: 20px;
  }
  
  .info-section li {
    margin-bottom: 5px;
  }
  
  .analyzer-note {
    font-size: 0.85em;
    color: #6c757d;
    font-style: italic;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .analyzer-note:before {
    content: "";
    display: inline-block;
    width: 16px;
    height: 16px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236c757d' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'%3E%3C/circle%3E%3Cline x1='12' y1='16' x2='12' y2='12'%3E%3C/line%3E%3Cline x1='12' y1='8' x2='12.01' y2='8'%3E%3C/line%3E%3C/svg%3E");
    margin-right: 5px;
  }
  
  .debug-btn {
    background-color: transparent;
    border: 1px solid #ced4da;
    color: #6c757d;
    border-radius: 4px;
    padding: 3px 6px;
    font-size: 0.75em;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .debug-btn:hover {
    background-color: #e9ecef;
    color: #495057;
  }
  
  .category-list {
    list-style-type: disc;
    padding-left: 20px;
    margin-top: 10px;
  }
  
  .category-item {
    margin-bottom: 8px;
    font-size: 0.95em;
    color: #333;
  }
  
  .empty-message {
    font-size: 0.85em;
    color: #6c757d;
    margin-top: 10px;
  }
  </style>