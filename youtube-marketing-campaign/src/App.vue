// First let's create the folder structure for our Vue 3 app

// src/App.vue - Main application component
<template>
  <div class="app-container">
    <h1 class="app-title">YouTube Creator Marketing Campaign Planner</h1>
    <div class="app-layout">
      <!-- Input form on the left -->
      <div class="input-section">
        <CampaignForm 
          @submit-form="generateCampaignPlan" 
          :isLoading="isLoading" 
        />
      </div>
      
      <!-- AI response on the right -->
      <div class="output-section" v-if="campaignPlan">
        <div class="output-scrollable">
          <CampaignOutput :campaignPlan="campaignPlan" />
        </div>
      </div>
      <div class="output-section placeholder" v-else>
        <div class="output-placeholder">
          <p>Your campaign plan will appear here</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import CampaignForm from './components/CampaignForm.vue';
import CampaignOutput from './components/CampaignOutput.vue';
import { generateAIResponse } from './services/geminiService';

const isLoading = ref(false);
const campaignPlan = ref(null);

const generateCampaignPlan = async (formData) => {
  isLoading.value = true;
  try {
    // In a real app, this would call the Gemini API
    const response = await generateAIResponse(formData);
    campaignPlan.value = response;
  } catch (error) {
    console.error('Error generating campaign plan:', error);
    alert('Failed to generate campaign plan. Please try again.');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style>
.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Roboto', Arial, sans-serif;
}

.app-title {
  text-align: center;
  margin-bottom: 30px;
  color: #1a73e8;
}

.app-layout {
  display: flex;
  gap: 30px;
}

.input-section {
  flex: 0 0 40%;
}

.output-section {
  flex: 0 0 60%;
  border-radius: 8px;
  border: 1px solid #e1e1e1;
  background: #f9f9f9;
  height: 600px;
}

.output-scrollable {
  overflow-x: auto;
  height: 100%;
  padding: 20px;
}

.output-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #757575;
  font-size: 16px;
}

.placeholder {
  background: #f0f4f9;
}

@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }
  
  .input-section, .output-section {
    flex: 1 1 100%;
  }
}
</style>

// src/components/CampaignForm.vue - Form component for user inputs
<template>
  <div class="campaign-form">
    <h2>Campaign Details</h2>
    <form @submit.prevent="submitForm">
      <!-- Campaign Goals -->
      <div class="form-group">
        <label for="campaignGoals">Campaign Goals</label>
        <textarea 
          id="campaignGoals" 
          v-model="formData.campaignGoals" 
          placeholder="What are your campaign goals? (e.g., increase brand awareness, drive sales, etc.)"
          required
        ></textarea>
      </div>
      
      <!-- Target Audience -->
      <div class="form-group">
        <label for="targetAudience">Target Audience</label>
        <textarea 
          id="targetAudience" 
          v-model="formData.targetAudience" 
          placeholder="Describe your target audience (e.g., age, interests, demographics)"
          required
        ></textarea>
      </div>
      
      <!-- Creator Details -->
      <div class="form-group">
        <label for="creatorDetails">Creator Details</label>
        <textarea 
          id="creatorDetails" 
          v-model="formData.creatorDetails" 
          placeholder="What type of creators are you looking for? (e.g., niche, style, content type)"
          required
        ></textarea>
      </div>
      
      <!-- Campaign Budget -->
      <div class="form-group">
        <label for="campaignBudget">Campaign Budget</label>
        <select id="campaignBudget" v-model="formData.campaignBudget" required>
          <option value="" disabled>Select budget range</option>
          <option value="under5k">Under $5,000</option>
          <option value="5kTo15k">$5,000 - $15,000</option>
          <option value="15kTo50k">$15,000 - $50,000</option>
          <option value="50kTo100k">$50,000 - $100,000</option>
          <option value="over100k">Over $100,000</option>
        </select>
      </div>
      
      <!-- Timeline -->
      <div class="form-group">
        <label for="timeline">Timeline</label>
        <select id="timeline" v-model="formData.timeline" required>
          <option value="" disabled>Select campaign timeline</option>
          <option value="under1month">Less than 1 month</option>
          <option value="1to3months">1-3 months</option>
          <option value="3to6months">3-6 months</option>
          <option value="6to12months">6-12 months</option>
          <option value="over12months">Over 12 months</option>
        </select>
      </div>
      
      <!-- Product Information -->
      <div class="form-group">
        <label for="productUrl">Product Information (URL)</label>
        <input 
          type="url" 
          id="productUrl" 
          v-model="formData.productUrl" 
          placeholder="Paste product URL for AI analysis"
          required
        />
      </div>
      
      <!-- Submit Button -->
      <button type="submit" class="submit-button" :disabled="isLoading">
        {{ isLoading ? 'Generating...' : 'Generate Campaign Plan' }}
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, defineEmits } from 'vue';

const emit = defineEmits(['submit-form']);

const props = defineProps({
  isLoading: {
    type: Boolean,
    default: false
  }
});

const formData = ref({
  campaignGoals: '',
  targetAudience: '',
  creatorDetails: '',
  campaignBudget: '',
  timeline: '',
  productUrl: ''
});

const submitForm = () => {
  emit('submit-form', { ...formData.value });
};
</script>

<style scoped>
.campaign-form {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-top: 0;
  color: #1a73e8;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

textarea, input, select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

textarea {
  min-height: 80px;
  resize: vertical;
}

.submit-button {
  background-color: #1a73e8;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  width: 100%;
  transition: background-color 0.3s;
}

.submit-button:hover {
  background-color: #0d5bca;
}

.submit-button:disabled {
  background-color: #a1c2f1;
  cursor: not-allowed;
}
</style>

// src/components/CampaignOutput.vue - Output component for AI response
<template>
  <div class="campaign-output">
    <!-- YouTube Video Ideas Card -->
    <div class="output-card">
      <h3 class="card-title">YouTube Video Ideas</h3>
      <ul class="idea-list">
        <li v-for="(idea, index) in campaignPlan.videoIdeas" :key="index">
          {{ idea }}
        </li>
      </ul>
    </div>

    <!-- Tracking & Measurement Card -->
    <div class="output-card">
      <h3 class="card-title">Tracking & Measurement</h3>
      <ul class="tracking-list">
        <li v-for="(metric, index) in campaignPlan.trackingMetrics" :key="index">
          {{ metric }}
        </li>
      </ul>
    </div>

    <!-- Keys to Success Card -->
    <div class="output-card">
      <h3 class="card-title">Keys to Success</h3>
      <ul class="success-list">
        <li v-for="(key, index) in campaignPlan.keysToSuccess" :key="index">
          {{ key }}
        </li>
      </ul>
    </div>

    <!-- Recommended Creators Card -->
    <div class="output-card creators-card">
      <h3 class="card-title">Recommended YouTube Creators</h3>
      <div class="creators-container">
        <div 
          v-for="(creator, index) in campaignPlan.recommendedCreators" 
          :key="index"
          class="creator-box"
        >
          <h4 class="creator-name">{{ creator.name }}</h4>
          <p class="creator-niche">{{ creator.niche }}</p>
          <div class="creator-stats">
            <div class="stat">
              <span class="stat-value">{{ formatNumber(creator.subscribers) }}</span>
              <span class="stat-label">Subscribers</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ formatNumber(creator.avgViews) }}</span>
              <span class="stat-label">Avg. Views</span>
            </div>
          </div>
          <div class="creator-actions">
            <a :href="creator.channelUrl" target="_blank" class="action-link visit">Visit Channel</a>
            <a :href="`mailto:${creator.email}`" class="action-link contact">Contact</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Email Template Card -->
    <div class="output-card">
      <h3 class="card-title">Email Collaboration Template</h3>
      <div class="email-template">
        <p><strong>Subject:</strong> {{ campaignPlan.emailTemplate.subject }}</p>
        <div class="email-body">
          <p v-for="(paragraph, index) in campaignPlan.emailTemplate.body" :key="index">
            {{ paragraph }}
          </p>
        </div>
      </div>
      <button class="copy-button" @click="copyEmailTemplate">Copy Email</button>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  campaignPlan: {
    type: Object,
    required: true
  }
});

const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

const copyEmailTemplate = () => {
  const subject = props.campaignPlan.emailTemplate.subject;
  const body = props.campaignPlan.emailTemplate.body.join('\n\n');
  const fullEmail = `Subject: ${subject}\n\n${body}`;
  
  navigator.clipboard.writeText(fullEmail)
    .then(() => {
      alert('Email template copied to clipboard!');
    })
    .catch(err => {
      console.error('Failed to copy email template:', err);
      alert('Failed to copy email template. Please try again.');
    });
};
</script>

<style scoped>
.campaign-output {
  display: flex;
  flex-direction: column;
  gap: 25px;
  min-width: 700px;
}

.output-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.card-title {
  margin-top: 0;
  color: #1a73e8;
  border-bottom: 1px solid #e1e1e1;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.idea-list, .tracking-list, .success-list {
  margin: 0;
  padding-left: 20px;
}

.idea-list li, .tracking-list li, .success-list li {
  margin-bottom: 10px;
}

.creators-container {
  display: flex;
  gap: 15px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.creator-box {
  flex: 0 0 250px;
  border: 1px solid #e1e1e1;
  border-radius: 8px;
  padding: 15px;
  background: #f9f9f9;
}

.creator-name {
  margin-top: 0;
  margin-bottom: 5px;
  color: #333;
}

.creator-niche {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}

.creator-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 15px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-weight: bold;
  color: #1a73e8;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.creator-actions {
  display: flex;
  gap: 10px;
}

.action-link {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  border-radius: 4px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.action-link.visit {
  background-color: #f1f3f4;
  color: #1a73e8;
}

.action-link.contact {
  background-color: #1a73e8;
  color: white;
}

.email-template {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.email-body {
  margin-top: 10px;
}

.copy-button {
  background-color: #34a853;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.copy-button:hover {
  background-color: #2d9248;
}
</style>

// src/services/geminiService.js - Service for Gemini API integration
// Note: This is a simplified implementation. You'll need to add proper API keys and authentication.

// First, install the Google AI API client:
// npm install @google/generative-ai

import { GoogleGenerativeAI } from '@google/generative-ai';

// This function would be replaced with your actual API key
const getApiKey = () => {
  // In a real app, you would securely manage your API key
  // For example, using environment variables or a backend service
  return 'YOUR_GEMINI_API_KEY'; // Replace with your actual API key
};

// Initialize the Gemini API client
const initializeGeminiAPI = () => {
  const apiKey = getApiKey();
  
  // Check if API key is provided
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    throw new Error('Invalid API key. Please provide a valid Gemini API key.');
  }
  
  return new GoogleGenerativeAI(apiKey);
};

// Generate AI response based on form data
export const generateAIResponse = async (formData) => {
  try {
    // In a real implementation, you would:
    // 1. Initialize the Gemini API client
    // 2. Create a prompt based on formData
    // 3. Call the API and parse the response
    
    // For now, we'll return mock data for demonstration purposes
    return mockGenerateResponse(formData);
    
    // The actual implementation would look something like this:
    /*
    const genAI = initializeGeminiAPI();
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `
      Create a YouTube marketing campaign plan with the following details:
      Campaign Goals: ${formData.campaignGoals}
      Target Audience: ${formData.targetAudience}
      Creator Details: ${formData.creatorDetails}
      Campaign Budget: ${formData.campaignBudget}
      Timeline: ${formData.timeline}
      Product URL: ${formData.productUrl}
      
      Please provide:
      1. 5 YouTube video ideas
      2. 4 tracking and measurement metrics
      3. 3 keys to success
      4. 4 recommended YouTube creators with their channel URLs, email, niche, subscribers, and average views
      5. A concise email template to propose collaboration
    `;
    
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Parse the text response into structured data
    // This would require additional parsing logic based on the API's response format
    
    return parsedResponse;
    */
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
};

// Mock response generator for demonstration purposes
const mockGenerateResponse = (formData) => {
  // This function returns mock data that would normally come from the Gemini API
  // In a real implementation, replace this with actual API calls

  const budgetText = {
    'under5k': 'under $5,000',
    '5kTo15k': '$5,000 - $15,000',
    '15kTo50k': '$15,000 - $50,000',
    '50kTo100k': '$50,000 - $100,000',
    'over100k': 'over $100,000'
  }[formData.campaignBudget];

  const timelineText = {
    'under1month': 'less than 1 month',
    '1to3months': '1-3 months',
    '3to6months': '3-6 months',
    '6to12months': '6-12 months',
    'over12months': 'over 12 months'
  }[formData.timeline];

  // Extract product name from URL (simplified)
  const productName = formData.productUrl
    .replace('https://', '')
    .replace('http://', '')
    .split('/')[1] || 'Your Product';

  return {
    videoIdeas: [
      `"A Day in the Life" featuring ${productName} in everyday scenarios`,
      `Honest Review: What makes ${productName} different from competitors`,
      `${productName} Challenge: Creative ways to use the product`,
      `${productName} Unboxing and First Impressions`,
      `How ${productName} Solved My [Problem Related to Target Audience]`
    ],
    trackingMetrics: [
      'View count and watch time for campaign videos',
      'Click-through rate to product page from video description',
      'Conversion rate from YouTube traffic',
      'Engagement metrics (likes, comments, shares)'
    ],
    keysToSuccess: [
      'Authentic creator partnerships that align with brand values',
      `Clear communication of campaign goals and ${timelineText} expectations`,
      `Realistic performance metrics aligned with ${budgetText} budget`
    ],
    recommendedCreators: [
      {
        name: 'Alex Tech Review',
        niche: 'Technology Reviews',
        subscribers: 1250000,
        avgViews: 350000,
        channelUrl: 'https://youtube.com/c/alextechreview',
        email: 'alex@techreview.com'
      },
      {
        name: 'Lifestyle with Jamie',
        niche: 'Lifestyle & Wellness',
        subscribers: 850000,
        avgViews: 200000,
        channelUrl: 'https://youtube.com/c/lifestylewithjamie',
        email: 'jamie@lifestylewithme.com'
      },
      {
        name: 'DIY Masters',
        niche: 'DIY & How-To',
        subscribers: 2100000,
        avgViews: 500000,
        channelUrl: 'https://youtube.com/c/diymasters',
        email: 'creators@diymasters.com'
      },
      {
        name: 'The Daily Vlogger',
        niche: 'Daily Life & Entertainment',
        subscribers: 1750000,
        avgViews: 400000,
        channelUrl: 'https://youtube.com/c/dailyvlogger',
        email: 'business@dailyvlogger.com'
      }
    ],
    emailTemplate: {
      subject: `Collaboration Opportunity: ${productName} Campaign Partnership`,
      body: [
        `Hi [Creator Name],`,
        
        `I'm [Your Name] from [Your Company], and I've been following your channel for some time now. Your content on [specific videos/content they've created] really resonates with our brand values at [Your Company].`,
        
        `We're launching a campaign for ${productName} with a budget of ${budgetText} and a timeline of ${timelineText}. Based on our campaign goals of "${formData.campaignGoals.substring(0, 50)}...", we believe your authentic style and audience would be perfect for this collaboration.`,
        
        `Would you be interested in discussing a potential partnership? We're flexible with content approaches and would love to hear your creative ideas for how to showcase ${productName} to your audience.`,
        
        `If you're interested, please let me know when you might be available for a quick call to discuss details.`,
        
        `Looking forward to hearing from you,`,
        
        `[Your Name]
[Your Position]
[Your Company]
[Your Contact Information]`
      ]
    }
  };
};

// src/main.js - Entry point
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');

// Additional files to be created:

// index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YouTube Marketing Campaign Planner</title>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8f9fa;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>

// package.json
{
  "name": "youtube-marketing-campaign-planner",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "vue-cli-service build",
    "lint": "vue-cli-service lint"
  },
  "dependencies": {
    "vue": "^3.2.13",
    "@google/generative-ai": "^0.1.0"
  },
  "devDependencies": {
    "@vue/cli-plugin-babel": "~5.0.0",
    "@vue/cli-plugin-eslint": "~5.0.0",
    "@vue/cli-service": "~5.0.0",
    "eslint": "^7.32.0",
    "eslint-plugin-vue": "^8.0.3"
  }
}

// vite.config.js (if using Vite instead of Vue CLI)
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true
  }
});