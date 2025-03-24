<!-- src/components/Home.vue -->
<template>
  <div class="home-container">
    <header class="app-header">
      <h1>YouTube Creator Campaign Planner</h1>
      <p>Create marketing campaigns with YouTube creators using AI</p>
    </header>
    
    <main class="app-main">
      <!-- Step 1: URL Entry -->
      <div class="input-section" v-if="currentStep === 1">
        <div class="url-entry-container">
          <h2>Enter Product URL</h2>
          <p class="url-instruction">Paste a product URL to analyze with AI and create a YouTube campaign plan</p>
          
          <div class="url-input-container">
            <input 
              type="url" 
              id="productUrl" 
              v-model="productUrl" 
              placeholder="https://www.example.com/product"
              @keyup.enter="analyzeProduct"
            />
            <button 
              @click="analyzeProduct" 
              class="analyze-btn" 
              :disabled="isAnalyzing || !productUrl">
              {{ isAnalyzing ? 'Analyzing...' : 'Analyze Product' }}
            </button>
          </div>

          <div v-if="urlError" class="error-message">
            {{ urlError }}
          </div>
        </div>
      </div>
      
      <!-- Step 2: Product Analysis and Campaign Flow -->
      <div class="workflow-container" v-if="currentStep > 1">
        <!-- Analysis + Form Section -->
        <div class="analysis-form-section">
          <!-- Product Analysis Result -->
          <ProductAnalyzer 
            :url="productUrl"
            :key="'analyzer-' + analyzerKey"
            @analysis-complete="handleProductAnalysis"
            ref="productAnalyzer"
          />
          
          <!-- Campaign Form (shown after analysis) -->
          <div v-if="currentStep >= 2 && productAnalysisResult && productAnalysisResult.success" class="campaign-details-form">
            <h3>Campaign Details</h3>
            <p class="form-instruction">Complete the following details to create your campaign plan</p>
            
            <form @submit.prevent="generateCampaign">
              <div class="form-group">
                <label for="campaignGoals">Campaign Goals</label>
                <textarea 
                  id="campaignGoals" 
                  v-model="formData.campaignGoals" 
                  placeholder="What are your campaign goals? E.g., Increase brand awareness, drive sales, etc."
                  rows="3"
                  required
                ></textarea>
              </div>
              
              <div class="form-group">
                <label for="targetAudience">Additional Target Audience Information</label>
                <textarea 
                  id="targetAudience" 
                  v-model="formData.targetAudience" 
                  placeholder="Any additional audience details beyond what was detected?"
                  rows="2"
                ></textarea>
                <div class="detected-info" v-if="productAnalysisResult && productAnalysisResult.data">
                  <span class="detected-label">Detected audience:</span> 
                  {{ productAnalysisResult.data.extractedInfo.targetDemographic }}
                </div>
              </div>
              
              <div class="form-group">
                <label for="creatorDetails">Creator Preferences</label>
                <textarea 
                  id="creatorDetails" 
                  v-model="formData.creatorDetails" 
                  placeholder="Any specific type of creators you're looking for?"
                  rows="2"
                ></textarea>
              </div>
              
              <div class="form-group">
                <label for="campaignBudget">Campaign Budget</label>
                <select id="campaignBudget" v-model="formData.campaignBudget" required>
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
                <select id="timeline" v-model="formData.timeline" required>
                  <option value="" disabled selected>Select campaign timeline</option>
                  <option value="1-2 weeks">1-2 weeks</option>
                  <option value="1 month">1 month</option>
                  <option value="2-3 months">2-3 months</option>
                  <option value="3-6 months">3-6 months</option>
                  <option value="6+ months">6+ months</option>
                </select>
              </div>
              
              <button type="submit" class="generate-btn" :disabled="isLoading">
                {{ isLoading ? 'Generating...' : 'Generate Campaign Plan' }}
              </button>
            </form>
            
            <div v-if="errorMessage" class="error-message">
              {{ errorMessage }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Campaign Response Section -->
      <div class="campaign-response-section" v-if="campaignResponse" id="campaignResponse">
        <div class="response-actions">
          <button @click="saveCampaign" class="save-btn">
            <span class="save-icon">💾</span> Save Campaign
          </button>
          <button @click="startOver" class="reset-btn">
            <span class="reset-icon">↺</span> New Campaign
          </button>
        </div>
        <ResponseSection 
          :campaign-data="campaignResponse"
          @contact-creator="showEmailTemplate"
          ref="responseSection"
        />
      </div>
    </main>
    
    <!-- Email Template Modal -->
    <EmailTemplate
      :show="showModal"
      :creator="selectedCreator"
      :campaign-info="{
        budget: formData.campaignBudget,
        timeline: formData.timeline,
        goals: formData.campaignGoals,
        productInfo: productUrl
      }"
      @close="closeModal"
      @copy="handleCopySuccess"
    />
  </div>
</template>

<script>
import { ref, reactive, getCurrentInstance } from 'vue';
import ProductAnalyzer from './ProductAnalyzer.vue';
import ResponseSection from './ResponseSection.vue';
import EmailTemplate from './EmailTemplate.vue';
import GoogleAIService from '../services/googleAI-new.js';

export default {
  name: 'Home',
  components: {
    ProductAnalyzer,
    ResponseSection,
    EmailTemplate
  },
  setup() {
    const instance = getCurrentInstance();
    const apiKey = instance?.appContext.config.globalProperties.$googleApiKey || '';
    const googleAI = new GoogleAIService(apiKey);
    
    // Workflow state
    const currentStep = ref(1);
    const productUrl = ref('');
    const analyzerKey = ref(0);
    const urlError = ref('');
    const isAnalyzing = ref(false);
    const productAnalysisResult = ref(null);
    
    // Form data
    const formData = reactive({
      campaignGoals: '',
      targetAudience: '',
      creatorDetails: '',
      campaignBudget: '',
      timeline: '',
      productInfo: ''
    });
    
    // Response data
    const campaignResponse = ref(null);
    const isLoading = ref(false);
    const errorMessage = ref('');
    
    // Modal state
    const showModal = ref(false);
    const selectedCreator = ref({});
    
    // Handle product URL analysis
    const analyzeProduct = async () => {
      if (!productUrl.value || productUrl.value.trim() === '') {
        urlError.value = 'Please enter a valid URL';
        return;
      }
      
      // Validate URL format
      try {
        new URL(productUrl.value);
      } catch (_) {
        urlError.value = 'Invalid URL format';
        return;
      }
      
      // Reset errors and set loading state
      urlError.value = '';
      isAnalyzing.value = true;
      
      // Update the key to force re-analysis
      analyzerKey.value++;
      
      // Move to step 2 - the ProductAnalyzer will run automatically due to the key change
      currentStep.value = 2;
    };
    
    // Product analysis results handler
    const handleProductAnalysis = (result) => {
      isAnalyzing.value = false;
      productAnalysisResult.value = result;
      
      if (result.success) {
        // Pre-fill form data with extracted information
        formData.productInfo = productUrl.value;
      } else {
        // Handle analysis error
        urlError.value = result.error || 'Failed to analyze product';
      }
    };
    
    // Method to generate campaign
    const generateCampaign = async () => {
      // Validate form
      if (!formData.campaignGoals || !formData.campaignBudget || !formData.timeline) {
        errorMessage.value = 'Please fill in all required fields';
        return;
      }
      
      isLoading.value = true;
      errorMessage.value = '';
      
      try {
        // Include product analysis data in the campaign generation
        const campaignData = { ...formData };
        if (productAnalysisResult.value && productAnalysisResult.value.success) {
          campaignData.productAnalysis = productAnalysisResult.value.data;
        }
        
        // Call the Google AI API via our service
        const response = await googleAI.generateCampaignPlan(campaignData);
        
        // Validate response structure
        if (!response) {
          throw new Error('Empty response received from AI service');
        }
        
        campaignResponse.value = response;
        
        // Scroll to the campaign response section
        setTimeout(() => {
          const responseElement = document.getElementById('campaignResponse');
          if (responseElement) {
            responseElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start',
              inline: 'nearest'
            });
            
            // Add a subtle highlighting effect
            responseElement.classList.add('highlight-new-content');
            setTimeout(() => {
              responseElement.classList.remove('highlight-new-content');
            }, 1500);
          }
        }, 300);
      } catch (error) {
        console.error('Error generating campaign:', error);
        errorMessage.value = 'Failed to generate campaign. Please try again.';
      } finally {
        isLoading.value = false;
      }
    };
    
    // Show email template modal
    const showEmailTemplate = (creator) => {
      selectedCreator.value = creator;
      showModal.value = true;
    };
    
    // Close modal
    const closeModal = () => {
      showModal.value = false;
    };
    
    // Handle successful copy
    const handleCopySuccess = () => {
      alert('Email template copied to clipboard!');
    };
    
    // Save the current campaign
    const saveCampaign = () => {
      if (campaignResponse.value) {
        // Save to localStorage for now
        const savedCampaigns = JSON.parse(localStorage.getItem('savedCampaigns') || '[]');
        savedCampaigns.push({
          data: { ...formData, productUrl: productUrl.value },
          result: campaignResponse.value,
          timestamp: new Date().toISOString()
        });
        localStorage.setItem('savedCampaigns', JSON.stringify(savedCampaigns));
        alert('Campaign saved successfully!');
      }
    };
    
    // Start over with a new campaign
    const startOver = () => {
      // Reset all state
      currentStep.value = 1;
      productUrl.value = '';
      urlError.value = '';
      errorMessage.value = '';
      campaignResponse.value = null;
      productAnalysisResult.value = null;
      
      // Reset form data
      Object.keys(formData).forEach(key => {
        formData[key] = '';
      });
      
      // Scroll to the top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    return {
      currentStep,
      productUrl,
      analyzerKey,
      urlError,
      isAnalyzing,
      productAnalysisResult,
      formData,
      campaignResponse,
      isLoading,
      errorMessage,
      showModal,
      selectedCreator,
      analyzeProduct,
      handleProductAnalysis,
      generateCampaign,
      showEmailTemplate,
      closeModal,
      handleCopySuccess,
      saveCampaign,
      startOver
    };
  }
};
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.app-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.app-header h1 {
  color: var(--primary-color);
  margin-bottom: 10px;
}

.app-main {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.url-entry-container {
  background-color: white;
  padding: 25px;
  border-radius: var(--border-radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.url-entry-container h2 {
  margin-bottom: 10px;
  color: var(--secondary-color);
}

.url-instruction {
  margin-bottom: 20px;
  color: var(--dark-gray);
}

.url-input-container {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.url-input-container input {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 16px;
}

.analyze-btn {
  padding: 10px 20px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.analyze-btn:hover {
  background-color: #cc0000;
}

.analyze-btn:disabled {
  background-color: #ffcccc;
  cursor: not-allowed;
}

.workflow-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
}

.analysis-form-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.campaign-details-form {
  background-color: white;
  padding: 20px;
  border-radius: var(--border-radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.campaign-details-form h3 {
  margin-bottom: 10px;
  color: var(--secondary-color);
}

.form-instruction {
  margin-bottom: 15px;
  color: var(--dark-gray);
  font-size: 0.9em;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: var(--secondary-color);
}

.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-family: inherit;
}

.detected-info {
  margin-top: 5px;
  font-size: 0.85em;
  color: var(--dark-gray);
  background-color: #f8f9fa;
  padding: 5px 8px;
  border-radius: 4px;
}

.detected-label {
  font-weight: 500;
}

.generate-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(to right, #8e44ad, #e74c3c);
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  margin-top: 10px;
  transition: all 0.3s;
  font-size: 1.1em;
  text-transform: capitalize;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.generate-btn:hover {
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.generate-btn:disabled {
  background: linear-gradient(to right, #a98cbf, #e9aca5);
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.campaign-response-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  scroll-margin-top: 20px;
  margin-top: 40px;
  min-height: 600px;
  margin-bottom: 60px;
  border-top: 1px solid #eee;
  padding-top: 30px;
  position: relative;
}

.campaign-response-section::before {
  content: "Campaign Plan";
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%);
  background-color: #f9f9f9;
  padding: 0 20px;
  color: var(--primary-color);
  font-weight: 600;
  font-size: 1.2em;
}

.response-actions {
  padding: 10px 20px;
  background-color: white;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.save-btn,
.reset-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background-color 0.3s;
}

.save-btn {
  background-color: #282828;
  color: white;
}

.save-btn:hover {
  background-color: #000;
}

.reset-btn {
  background-color: #f8f9fa;
  color: #495057;
  border: 1px solid #ced4da;
}

.reset-btn:hover {
  background-color: #e9ecef;
}

.save-icon,
.reset-icon {
  font-size: 16px;
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  font-size: 0.9em;
}

@keyframes highlight-pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.2); }
  70% { box-shadow: 0 0 0 15px rgba(255, 0, 0, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
}

.highlight-new-content {
  animation: highlight-pulse 1.5s ease-out;
}

/* Responsive styles */
@media (max-width: 768px) {
  .workflow-container {
    flex-direction: column;
  }
  
  .analysis-form-section,
  .campaign-response-section {
    width: 100%;
  }
}
</style> 