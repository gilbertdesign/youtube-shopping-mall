.url-input-container {
    display: flex;
    gap: 8px;
  }
  
  .url-input-container input {
    flex: 1;
  }
  
  .reanalyze-btn {
    padding: 8px 12px;
    background-color: #f8f9fa;
    border: 1px solid #ced4da;
    border-radius: 4px;
    color: #495057;
    font-size: 0.9em;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  
  .reanalyze-btn:hover {
    background-color: #e9ecef;
    color: #212529;
  }<!-- src/components/CampaignForm.vue -->
  <template>
    <div class="form-container">
      <h2>Campaign Details</h2>
      
      <form @submit.prevent="onSubmit">
        <div class="form-group">
          <label for="campaignGoals">Campaign Goals</label>
          <textarea 
            id="campaignGoals" 
            v-model="form.campaignGoals" 
            placeholder="What are your campaign goals? E.g., Increase brand awareness, drive sales, etc."
            rows="3"
            required
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="targetAudience">Target Audience</label>
          <textarea 
            id="targetAudience" 
            v-model="form.targetAudience" 
            placeholder="Describe your target audience (age, interests, demographics)"
            rows="3"
            required
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="creatorDetails">Creator Details</label>
          <textarea 
            id="creatorDetails" 
            v-model="form.creatorDetails" 
            placeholder="What type of creators are you looking for? Any specific niches?"
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="campaignBudget">Campaign Budget</label>
          <select id="campaignBudget" v-model="form.campaignBudget" required>
            <option value="" disabled selected>Select budget range</option>
            <option value="$1,000 - $5,000">$1,000 - $5,000</option>
            <option value="$5,000 - $10,000">$5,000 - $10,000</option>
            <option value="$10,000 - $25,000">$10,000 - $25,000</option>
            <option value="$25,000 - $50,000">$25,000 - $50,000</option>
            <option value="$50,000+">$50,000+</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="timeline">Timeline</label>
          <select id="timeline" v-model="form.timeline" required>
            <option value="" disabled selected>Select campaign timeline</option>
            <option value="1-2 weeks">1-2 weeks</option>
            <option value="1 month">1 month</option>
            <option value="2-3 months">2-3 months</option>
            <option value="3-6 months">3-6 months</option>
            <option value="6+ months">6+ months</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="productInfo">Product Information (URL)</label>
          <div class="url-input-container">
            <input 
              type="url" 
              id="productInfo" 
              v-model="form.productInfo" 
              placeholder="Paste product URL for AI analysis"
              @input="handleUrlInput"
            />
            <button 
              v-if="form.productInfo" 
              @click="clearAndReanalyzeUrl" 
              type="button"
              class="reanalyze-btn"
            >
              Reanalyze
            </button>
          </div>
          <ProductAnalyzer 
            :url="form.productInfo"
            :key="urlAnalysisKey"
            @analysis-complete="handleProductAnalysis"
            @api-status="$emit('api-status')"
            ref="productAnalyzer"
          />
        </div>
        
        <button type="submit" class="generate-btn" :disabled="isLoading">
          {{ isLoading ? 'Generating...' : 'Generate Campaign Plan' }}
        </button>
      </form>
      
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
    </div>
  </template>
  
  <script>
  import { reactive, toRefs, ref } from 'vue';
  import ProductAnalyzer from './ProductAnalyzer.vue';
  
  export default {
    name: 'CampaignForm',
    components: {
      ProductAnalyzer
    },
    props: {
      isLoading: {
        type: Boolean,
        default: false
      },
      errorMessage: {
        type: String,
        default: ''
      }
    },
    emits: ['submit', 'api-status'],
    setup(props, { emit }) {
      const formState = reactive({
        form: {
          campaignGoals: '',
          targetAudience: '',
          creatorDetails: '',
          campaignBudget: '',
          timeline: '',
          productInfo: ''
        }
      });
      
      const productAnalysisResult = ref(null);
      const urlAnalysisKey = ref(0); // Key to force re-render of the ProductAnalyzer
      
      const onSubmit = () => {
        // Validate required fields
        if (!formState.form.campaignGoals || !formState.form.targetAudience || 
            !formState.form.campaignBudget || !formState.form.timeline) {
          return;
        }
        
        // Include product analysis data if available
        const formData = { ...formState.form };
        if (productAnalysisResult.value && productAnalysisResult.value.success) {
          formData.productAnalysis = productAnalysisResult.value.data;
        }
        
        emit('submit', formData);
      };
      
      const handleProductAnalysis = (result) => {
        productAnalysisResult.value = result;
      };
      
      // Handle URL input changes
      const handleUrlInput = () => {
        // When URL changes manually, we'll rely on the watcher in ProductAnalyzer
        console.log('URL input changed:', formState.form.productInfo);
      };
      
      // Force reanalysis of the current URL
      const clearAndReanalyzeUrl = () => {
        if (formState.form.productInfo) {
          console.log('Forcing reanalysis of URL:', formState.form.productInfo);
          // Increment key to force component re-rendering
          urlAnalysisKey.value++;
        }
      };
      
      return {
        ...toRefs(formState),
        ...toRefs(props),
        onSubmit,
        handleProductAnalysis,
        handleUrlInput,
        clearAndReanalyzeUrl,
        urlAnalysisKey
      };
    }
  };
  </script>
  
  <style scoped>
  .form-container {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;
  }
  
  h2 {
    margin-bottom: 20px;
    color: #333;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
  }
  
  .form-group input,
  .form-group textarea,
  .form-group select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
  }
  
  .form-group textarea {
    resize: vertical;
  }
  
  .generate-btn {
    width: 100%;
    padding: 12px;
    background-color: #ff0000;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .generate-btn:hover {
    background-color: #cc0000;
  }
  
  .generate-btn:disabled {
    background-color: #ff9999;
    cursor: not-allowed;
  }
  
  .error-message {
    color: #ff0000;
    margin-top: 15px;
    text-align: center;
  }
  </style>