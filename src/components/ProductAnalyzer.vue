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
        <LoadingSpinner message="Analyzing product with AI..." />
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
          
          <div class="info-item target-audience-item">
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
          <h4>Recommended Creator Categories</h4>
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
  import { ref, watch, inject } from 'vue';
  import { fetchProductInfo } from '../utils/apiUtils';
  import DebugOutput from './DebugOutput.vue';
  import LoadingSpinner from './LoadingSpinner.vue';
  import { getApiKey } from '../utils/envConfig';
  
  export default {
    name: 'ProductAnalyzer',
    components: {
      DebugOutput,
      LoadingSpinner
    },
    props: {
      url: {
        type: String,
        default: ''
      }
    },
    emits: ['analysis-complete', 'api-status'],
    setup(props, { emit }) {
      const config = inject('config') || {};
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
          // Get API key from env config
          const apiKey = getApiKey();
          
          if (!apiKey) {
            console.warn('No Gemini API key found. Using mock data instead.');
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
            emit('analysis-complete', { success: true, data: info });
          }
        } catch (err) {
          console.error('Error analyzing product:', err);
          error.value = err.message || 'Failed to analyze product';
          emit('analysis-complete', { success: false, error: error.value });
        } finally {
          isLoading.value = false;
        }
      };
      
      // Retry analysis
      const retryAnalysis = () => {
        error.value = null;
        analyzeProduct(props.url);
      };
      
      // Check if the URL is valid
      const isValidUrl = (url) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };
      
      // Toggle debug output visibility
      const toggleDebugOutput = () => {
        showDebugOutput.value = !showDebugOutput.value;
      };
      
      // Hide debug output
      const hideDebugOutput = () => {
        showDebugOutput.value = false;
      };
      
      // Helper to get creator categories
      const getCreatorCategories = (info) => {
        const categories = [];
        
        // Get creator categories from the recommended creator types field
        if (info.recommendedCreatorTypes && Array.isArray(info.recommendedCreatorTypes)) {
          categories.push(...info.recommendedCreatorTypes);
        }
        
        // If no categories found, generate generic categories based on product type
        if (categories.length === 0 && info.category) {
          const productType = info.category.toLowerCase();
          
          if (productType.includes('tech') || productType.includes('electronic')) {
            categories.push('Tech Reviewers', 'Gadget Enthusiasts', 'Unboxing Channels');
          } else if (productType.includes('beauty') || productType.includes('cosmetic')) {
            categories.push('Beauty Vloggers', 'Makeup Artists', 'Skincare Influencers');
          } else if (productType.includes('fashion') || productType.includes('clothing')) {
            categories.push('Fashion Influencers', 'Style Gurus', 'Lifestyle Vloggers');
          } else if (productType.includes('food') || productType.includes('kitchen')) {
            categories.push('Food Channels', 'Cooking Tutorials', 'Kitchen Gadget Reviewers');
          } else if (productType.includes('fitness') || productType.includes('sport')) {
            categories.push('Fitness Channels', 'Workout Instructors', 'Health & Wellness Creators');
          } else if (productType.includes('game') || productType.includes('gaming')) {
            categories.push('Gaming Channels', 'Game Reviewers', 'Lets Play Creators');
          } else if (productType.includes('home') || productType.includes('decor')) {
            categories.push('Home Decor Channels', 'DIY Creators', 'Interior Design Experts');
          } else {
            // Generic categories
            categories.push('Product Reviewers', 'Lifestyle Vloggers', 'How-To Channels');
          }
        }
        
        return categories;
      };
      
      // Check API status
      const checkApiStatus = () => {
        emit('api-status');
      };
      
      // Watch URL changes
      watch(() => props.url, (newUrl) => {
        if (newUrl && newUrl.trim() !== '') {
          analyzeProduct(newUrl);
        }
      }, { immediate: true });
      
      return {
        isLoading,
        error,
        productInfo,
        showDebugOutput,
        retryAnalysis,
        toggleDebugOutput,
        hideDebugOutput,
        getCreatorCategories,
        checkApiStatus
      };
    }
  };
  </script>
  
  <style scoped>
  .product-analyzer {
    width: 100%;
    background-color: white;
    border-radius: var(--border-radius);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 25px;
    margin-bottom: 20px;
  }
  
  .analyzer-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 40px 20px;
    text-align: center;
  }
  
  .loading-detail {
    color: var(--dark-gray);
    margin-top: 10px;
    font-size: 0.9rem;
  }
  
  .analyzer-error {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px 20px;
    text-align: center;
  }
  
  .error-icon {
    color: #dc3545;
    margin-bottom: 15px;
  }
  
  .error-message {
    font-weight: 500;
    margin-bottom: 10px;
    color: #dc3545;
  }
  
  .error-tip {
    color: var(--dark-gray);
    font-size: 0.9rem;
    margin-bottom: 20px;
  }
  
  .retry-btn {
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: var(--border-radius);
    padding: 8px 20px;
    cursor: pointer;
    font-weight: 500;
    transition: background-color 0.2s;
  }
  
  .retry-btn:hover {
    background-color: #e50000;
  }
  
  h3[data-source]::after {
    content: attr(data-source);
    font-size: 0.7em;
    background-color: var(--light-gray);
    padding: 3px 8px;
    border-radius: 12px;
    margin-left: 10px;
    color: var(--dark-gray);
    font-weight: normal;
    vertical-align: middle;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
    margin: 20px 0;
  }
  
  .info-item {
    display: flex;
    flex-direction: column;
    padding: 12px;
    background-color: var(--light-gray);
    border-radius: var(--border-radius);
  }
  
  .target-audience-item {
    grid-column: span 2;
  }
  
  @media (max-width: 768px) {
    .info-grid {
      grid-template-columns: 1fr;
    }
    
    .target-audience-item {
      grid-column: span 1;
    }
  }
  
  .info-label {
    font-size: 0.8rem;
    color: var(--dark-gray);
    margin-bottom: 5px;
  }
  
  .info-value {
    font-weight: 500;
  }
  
  .info-section {
    margin-bottom: 20px;
  }
  
  .info-section h4 {
    margin-bottom: 10px;
    color: var(--secondary-color);
    font-size: 1.1rem;
  }
  
  .info-section ul {
    padding-left: 20px;
  }
  
  .info-section li {
    margin-bottom: 5px;
  }
  
  .category-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    list-style: none;
    padding: 0;
  }
  
  .category-item {
    background-color: var(--light-gray);
    padding: 6px 12px;
    border-radius: 15px;
    font-size: 0.9rem;
  }
  
  .empty-message {
    color: var(--dark-gray);
    font-style: italic;
  }
  
  .analyzer-note {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.85rem;
    color: var(--dark-gray);
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid #eee;
  }
  
  .debug-btn {
    padding: 3px 8px;
    background-color: var(--light-gray);
    border: none;
    border-radius: 4px;
    color: var(--dark-gray);
    font-size: 0.85rem;
    cursor: pointer;
  }
  
  .debug-btn:hover {
    background-color: #e9ecef;
  }
  
  .mock-note {
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
  }
  
  .analyzer-url {
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
  }
  
  .analyzer-results {
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
  }
  </style>