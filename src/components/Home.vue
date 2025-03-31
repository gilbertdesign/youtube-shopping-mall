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
                <div class="detected-info" v-if="productAnalysisResult && productAnalysisResult.data && getCreatorCategories(productAnalysisResult.data.extractedInfo).length > 0">
                  <span class="detected-label">Suggested creator categories:</span> 
                  {{ getCreatorCategories(productAnalysisResult.data.extractedInfo).join(', ') }}
                </div>
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
                Generate Campaign Plan
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
          :campaign-inputs="{
            goals: formData.campaignGoals,
            budget: formData.campaignBudget,
            timeline: formData.timeline
          }"
          @contact-creator="showEmailTemplate"
          ref="responseSection"
        />
      </div>
      
      <!-- Timeline-Specific Plan Section -->
      <div class="timeline-plan-container" v-if="campaignResponse && formData.timeline" id="timelinePlan">
        <h2 class="section-title">Timeline Marketing Plan</h2>
        <p class="section-description">
          Based on your selected timeline of <strong>{{ formData.timeline }}</strong>, 
          here's a detailed marketing plan and creator collaboration strategy:
        </p>
        <TimelinePlanSection 
          :timeline="formData.timeline"
          :campaignData="{
            campaignGoals: formData.campaignGoals,
            targetAudience: formData.targetAudience,
            creatorDetails: formData.creatorDetails,
            campaignBudget: formData.campaignBudget,
            timeline: formData.timeline,
            productInfo: formData.productInfo,
            productAnalysis: productAnalysisResult?.data
          }"
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
    
    <!-- Loading spinners -->
    <LoadingSpinner 
      v-if="isLoading" 
      fullscreen 
      message="Generating your campaign plan..."
    />
    
    <LoadingSpinner 
      v-if="isAnalyzing && currentStep > 1 && currentStep !== 2" 
      fullscreen 
      message="Analyzing product details..."
    />
    
    <div v-if="campaignResponse" class="api-status-indicator">
      <small v-if="usingMockData" class="mock-data-warning">
        Using mock data (API key not detected or Gemini API error)
      </small>
      <small v-else class="real-data-indicator">
        Using Gemini AI for content generation
      </small>
    </div>
  </div>
</template>

<script>
import { ref, reactive, inject, computed, onMounted, watch } from 'vue';
import ProductAnalyzer from './ProductAnalyzer.vue';
import ResponseSection from './ResponseSection.vue';
import EmailTemplate from './EmailTemplate.vue';
import LoadingSpinner from './LoadingSpinner.vue';
import TimelinePlanSection from './TimelinePlanSection.vue';
import GoogleAIService from '../services/googleAI-new.js';
import { getApiKey } from '../utils/envConfig';

export default {
  name: 'Home',
  components: {
    ProductAnalyzer,
    ResponseSection,
    EmailTemplate,
    LoadingSpinner,
    TimelinePlanSection
  },
  setup() {
    // Get config from global provide
    const config = inject('config') || {};
    const apiKey = getApiKey();
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
    
    const usingMockData = ref(false);
    
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
      
      // Clear previous results and errors
      errorMessage.value = '';
      isLoading.value = true;
      
      try {
        // Check if we're using mock data
        usingMockData.value = googleAI.useMock;
        
        // Prepare data for the AI service
        const campaignData = {
          campaignGoals: formData.campaignGoals,
          targetAudience: formData.targetAudience,
          creatorDetails: formData.creatorDetails,
          campaignBudget: formData.campaignBudget,
          timeline: formData.timeline,
          productInfo: formData.productInfo,
          productAnalysis: productAnalysisResult.value?.data
        };
        
        // Generate campaign plan using Google AI Service
        const response = await googleAI.generateCampaignPlan(campaignData);
        
        // Handle response
        if (response) {
          campaignResponse.value = response;
          // Scroll to results
          setTimeout(() => {
            document.getElementById('campaignResponse')?.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
            
            // Add a second timeout to scroll to timeline plan after initial view of response
            setTimeout(() => {
              document.getElementById('timelinePlan')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }, 1000);
          }, 100);
        } else {
          errorMessage.value = 'Failed to generate campaign. Please try again.';
        }
      } catch (error) {
        console.error('Campaign generation error:', error);
        errorMessage.value = `Error: ${error.message || 'Failed to generate campaign'}`;
        usingMockData.value = true; // If error, we're probably using mock data
      } finally {
        isLoading.value = false;
      }
    };
    
    // Save campaign to local storage
    const saveCampaign = () => {
      if (!campaignResponse.value) return;
      
      try {
        // Get existing saved campaigns
        const savedCampaigns = JSON.parse(localStorage.getItem('savedCampaigns') || '[]');
        
        // Create new campaign object
        const newCampaign = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          name: campaignResponse.value.campaignName,
          url: productUrl.value,
          budget: formData.campaignBudget,
          timeline: formData.timeline,
          data: campaignResponse.value
        };
        
        // Add new campaign and save
        savedCampaigns.push(newCampaign);
        localStorage.setItem('savedCampaigns', JSON.stringify(savedCampaigns));
        
        // Show success notification
        alert('Campaign saved successfully!');
      } catch (error) {
        console.error('Error saving campaign:', error);
        alert('Failed to save campaign. Please try again.');
      }
    };
    
    // Reset the form and start over
    const startOver = () => {
      // Reset all state
      currentStep.value = 1;
      productUrl.value = '';
      analyzerKey.value = 0;
      productAnalysisResult.value = null;
      campaignResponse.value = null;
      errorMessage.value = '';
      urlError.value = '';
      
      // Reset form data
      Object.keys(formData).forEach(key => {
        formData[key] = '';
      });
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    // Email template handlers
    const showEmailTemplate = (creator) => {
      selectedCreator.value = creator;
      showModal.value = true;
    };
    
    const closeModal = () => {
      showModal.value = false;
    };
    
    const handleCopySuccess = () => {
      alert('Email template copied to clipboard!');
      closeModal();
    };
    
    // Add this helper function that mirrors the one from ProductAnalyzer
    const getCreatorCategories = (info) => {
      if (!info) return [];
      
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
    
    return {
      // State
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
      usingMockData,
      
      // Methods
      analyzeProduct,
      handleProductAnalysis,
      generateCampaign,
      saveCampaign,
      startOver,
      showEmailTemplate,
      closeModal,
      handleCopySuccess,
      getCreatorCategories
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
}

.app-header h1 {
  color: var(--primary-color);
  font-size: 2rem;
  margin-bottom: 8px;
}

.app-header p {
  color: var(--dark-gray);
  font-size: 1.1rem;
}

.input-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
}

.url-entry-container {
  max-width: 600px;
  width: 100%;
  background-color: white;
  border-radius: var(--border-radius);
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
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
  margin-bottom: 15px;
}

.url-input-container input {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: var(--border-radius) 0 0 var(--border-radius);
  font-size: 1rem;
}

.url-input-container input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.analyze-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0 var(--border-radius) var(--border-radius) 0;
  padding: 0 20px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}

.analyze-btn:hover:not(:disabled) {
  background-color: #e50000;
}

.analyze-btn:disabled {
  background-color: #ff9999;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: 10px;
}

.workflow-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.analysis-form-section {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.campaign-details-form {
  background-color: white;
  border-radius: var(--border-radius);
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.campaign-details-form h3 {
  margin-bottom: 10px;
  color: var(--secondary-color);
}

.form-instruction {
  margin-bottom: 20px;
  color: var(--dark-gray);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--secondary-color);
}

.form-group textarea, 
.form-group select {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: var(--border-radius);
  font-size: 1rem;
}

.form-group textarea:focus, 
.form-group select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.detected-info {
  margin-top: 8px;
  font-size: 0.9rem;
  color: #6c757d;
}

.detected-label {
  font-weight: 500;
}

.generate-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  padding: 12px 20px;
  font-weight: bold;
  font-size: 1rem;
  width: 100%;
  cursor: pointer;
  transition: background-color 0.2s;
}

.generate-btn:hover:not(:disabled) {
  background-color: #e50000;
}

.generate-btn:disabled {
  background-color: #ff9999;
  cursor: not-allowed;
}

.campaign-response-section {
  background-color: white;
  border-radius: var(--border-radius);
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 30px;
}

.response-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-bottom: 20px;
}

.save-btn, .reset-btn {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn {
  background-color: #28a745;
  color: white;
  border: none;
}

.save-btn:hover {
  background-color: #218838;
}

.reset-btn {
  background-color: #f8f9fa;
  color: #495057;
  border: 1px solid #ddd;
}

.reset-btn:hover {
  background-color: #e9ecef;
}

.save-icon, .reset-icon {
  margin-right: 6px;
}

.timeline-plan-container {
  background-color: white;
  border-radius: var(--border-radius);
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-top: 30px;
}

.section-title {
  color: var(--secondary-color);
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.5rem;
}

.section-description {
  margin-bottom: 25px;
  color: var(--dark-gray);
  line-height: 1.5;
}

.api-status-indicator {
  margin-bottom: 10px;
  text-align: center;
  font-size: 0.8rem;
}

.mock-data-warning {
  color: #856404;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  padding: 4px 8px;
  border-radius: 4px;
}

.real-data-indicator {
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 4px 8px;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .url-input-container {
    flex-direction: column;
  }
  
  .url-input-container input {
    border-radius: var(--border-radius) var(--border-radius) 0 0;
  }
  
  .analyze-btn {
    border-radius: 0 0 var(--border-radius) var(--border-radius);
    padding: 12px;
  }
}
</style> 