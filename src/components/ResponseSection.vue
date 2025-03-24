<!-- src/components/ResponseSection.vue -->
<template>
    <div class="response-section" ref="responseContainer">
      <div class="response-content">
        <!-- Campaign Name Header -->
        <div class="campaign-header" v-if="campaignData.campaignName">
          <h2>{{ campaignData.campaignName }}</h2>
        </div>
        
        <!-- Video Ideas Card -->
        <div class="response-card">
          <h3>YouTube Video Ideas</h3>
          <ul v-if="campaignData.videoIdeas && campaignData.videoIdeas.length > 0">
            <li v-for="(idea, index) in campaignData.videoIdeas" :key="'idea-'+index">
              {{ idea }}
            </li>
          </ul>
          <p v-else class="empty-message">No video ideas available</p>
        </div>
        
        <!-- Tracking & Measurement Card -->
        <div class="response-card">
          <h3>Tracking & Measurement</h3>
          <ul v-if="campaignData.trackingMetrics && campaignData.trackingMetrics.length > 0">
            <li v-for="(metric, index) in campaignData.trackingMetrics" :key="'metric-'+index">
              {{ metric }}
            </li>
          </ul>
          <p v-else class="empty-message">No tracking metrics available</p>
        </div>
        
        <!-- Keys to Success Card -->
        <div class="response-card">
          <h3>Keys to Success</h3>
          <ul v-if="campaignData.keysToSuccess && campaignData.keysToSuccess.length > 0">
            <li v-for="(key, index) in campaignData.keysToSuccess" :key="'key-'+index">
              {{ key }}
            </li>
          </ul>
          <p v-else class="empty-message">No keys to success available</p>
        </div>
        
        <!-- Creator Categories Section -->
        <div v-if="hasCreatorCategories" class="creator-categories-section">
          <div 
            v-for="(category, catIndex) in campaignData.creatorCategories" 
            :key="'category-'+catIndex" 
            class="response-card creator-category-card"
          >
            <h3>{{ category.categoryName }}</h3>
            <div v-if="category.creators && category.creators.length > 0" class="creators-list">
              <div 
                v-for="(creator, index) in getVisibleCreators(category.creators, catIndex)" 
                :key="'creator-'+catIndex+'-'+index"
                class="creator-item"
              >
                <div class="creator-header">
                  <h4>{{ creator.name || 'Unknown Creator' }}</h4>
                  <div class="creator-stats">
                    <div class="stat-item">
                      <span class="stat-icon">👥</span>
                      <span class="stat-value">{{ creator.subscribers || 'Unknown' }}</span>
                    </div>
                    <div class="stat-item">
                      <span class="stat-icon">👁️</span>
                      <span class="stat-value">{{ creator.averageViews || 'Unknown' }} avg. views</span>
                    </div>
                  </div>
                </div>
                <p class="creator-description">{{ creator.description || 'No description available' }}</p>
                
                <div v-if="creator.budgetFit" class="budget-fit" :class="getBudgetFitClass(creator.budgetFit)">
                  {{ creator.budgetFit }}
                </div>
                
                <div class="creator-footer">
                  <a :href="creator.channelUrl || 'https://youtube.com'" target="_blank" class="channel-link">
                    View Channel
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                  </a>
                  <button 
                    @click="onContactCreator(creator)" 
                    class="contact-btn"
                  >
                    Contact Creator
                  </button>
                </div>
              </div>
              
              <!-- Load More Button -->
              <div v-if="hasMoreCreators(category.creators, catIndex)" class="load-more-container">
                <button @click="loadMoreCreators(catIndex)" class="load-more-btn">
                  <span class="load-more-icon">+</span>
                  Load More Creators
                </button>
              </div>
            </div>
            <p v-else class="empty-message">No creators available in this category</p>
          </div>
        </div>
        
        <!-- Fallback for old format -->
        <div v-else-if="hasOldFormatCreators" class="response-card creators-card">
          <h3>Recommended YouTube Creators</h3>
          <div v-if="campaignData.recommendedCreators && campaignData.recommendedCreators.length > 0" class="creators-list">
            <div 
              v-for="(creator, index) in getVisibleOldFormatCreators()" 
              :key="'creator-'+index"
              class="creator-item"
            >
              <div class="creator-header">
                <h4>{{ creator.name || 'Unknown Creator' }}</h4>
                <div class="creator-stats">
                  <div class="stat-item">
                    <span class="stat-icon">👥</span>
                    <span class="stat-value">{{ creator.subscribers || 'Unknown' }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-icon">👁️</span>
                    <span class="stat-value">{{ creator.averageViews || 'Unknown' }} avg. views</span>
                  </div>
                </div>
              </div>
              <p class="creator-description">{{ creator.description || 'No description available' }}</p>
              <div class="creator-footer">
                <a :href="creator.channelUrl || 'https://youtube.com'" target="_blank" class="channel-link">
                  View Channel
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                </a>
                <button 
                  @click="onContactCreator(creator)" 
                  class="contact-btn"
                >
                  Contact Creator
                </button>
              </div>
            </div>
            
            <!-- Load More Button for old format -->
            <div v-if="hasMoreOldFormatCreators()" class="load-more-container">
              <button @click="loadMoreOldFormatCreators()" class="load-more-btn">
                <span class="load-more-icon">+</span>
                Load More Creators
              </button>
            </div>
          </div>
          <p v-else class="empty-message">No creator recommendations available</p>
        </div>
        
        <!-- Debug info button (only visible in development mode) -->
        <DebugButton v-if="isDevelopment" :data="campaignData" />
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, watch, computed } from 'vue';
  import DebugButton from './DebugButton.vue';
  
  export default {
    name: 'ResponseSection',
    components: {
      DebugButton
    },
    props: {
      campaignData: {
        type: Object,
        required: true,
        default: () => ({
          campaignName: '',
          videoIdeas: [],
          trackingMetrics: [],
          keysToSuccess: [],
          creatorCategories: [],
          recommendedCreators: []
        })
      }
    },
    emits: ['contact-creator'],
    setup(props, { emit }) {
      // Create ref for the response container to enable scrolling
      const responseContainer = ref(null);
      
      // For controlling the number of visible creators in each category
      const visibleCreatorCounts = ref({});
      const oldFormatVisibleCount = ref(3);
      
      // Initialize with 3 visible creators per category
      const initializeVisibleCounts = () => {
        if (props.campaignData.creatorCategories) {
          props.campaignData.creatorCategories.forEach((category, index) => {
            // Ensure we have at least 3 creators in each category, or all available if less than 3
            visibleCreatorCounts.value[index] = 3;
          });
        }
      };
      
      // Check if we have all expected properties
      console.log("Campaign data received in ResponseSection:", props.campaignData);
      
      // Check if we're in development mode
      const isDevelopment = import.meta.env.DEV || true;
      
      // Computed properties to check for creator data
      const hasCreatorCategories = computed(() => {
        return props.campaignData.creatorCategories && 
               Array.isArray(props.campaignData.creatorCategories) && 
               props.campaignData.creatorCategories.length > 0;
      });
      
      const hasOldFormatCreators = computed(() => {
        return props.campaignData.recommendedCreators && 
               Array.isArray(props.campaignData.recommendedCreators) && 
               props.campaignData.recommendedCreators.length > 0;
      });
      
      // Functions for showing/loading more creators
      const getVisibleCreators = (creators, categoryIndex) => {
        const visibleCount = visibleCreatorCounts.value[categoryIndex] || 3;
        return creators.slice(0, visibleCount);
      };
      
      const hasMoreCreators = (creators, categoryIndex) => {
        const visibleCount = visibleCreatorCounts.value[categoryIndex] || 3;
        return creators.length > visibleCount;
      };
      
      const loadMoreCreators = (categoryIndex) => {
        const currentCount = visibleCreatorCounts.value[categoryIndex] || 3;
        const totalCreators = props.campaignData.creatorCategories[categoryIndex].creators.length;
        // Increase by 3 or show all remaining
        visibleCreatorCounts.value[categoryIndex] = Math.min(currentCount + 3, totalCreators);
      };
      
      // For old format creators
      const getVisibleOldFormatCreators = () => {
        return props.campaignData.recommendedCreators.slice(0, oldFormatVisibleCount.value);
      };
      
      const hasMoreOldFormatCreators = () => {
        return props.campaignData.recommendedCreators.length > oldFormatVisibleCount.value;
      };
      
      const loadMoreOldFormatCreators = () => {
        const totalCreators = props.campaignData.recommendedCreators.length;
        // Increase by 3 or show all remaining
        oldFormatVisibleCount.value = Math.min(oldFormatVisibleCount.value + 3, totalCreators);
      };
      
      // Determine budget fit CSS class
      const getBudgetFitClass = (budgetFit) => {
        if (!budgetFit) return 'budget-fit-medium';
        
        if (budgetFit.toLowerCase().includes('high')) {
          return 'budget-fit-high';
        } else if (budgetFit.toLowerCase().includes('low')) {
          return 'budget-fit-low';
        } else {
          return 'budget-fit-medium';
        }
      };
      
      // Validate data structure
      const validateData = () => {
        const { videoIdeas, trackingMetrics, keysToSuccess } = props.campaignData;
        
        // Check if all required arrays exist
        const hasVideoIdeas = Array.isArray(videoIdeas);
        const hasMetrics = Array.isArray(trackingMetrics);
        const hasKeys = Array.isArray(keysToSuccess);
        
        console.log('ResponseSection data validation:', {
          hasVideoIdeas,
          hasMetrics,
          hasKeys,
          videoIdeasCount: hasVideoIdeas ? videoIdeas.length : 0,
          metricsCount: hasMetrics ? trackingMetrics.length : 0,
          keysCount: hasKeys ? keysToSuccess.length : 0,
          hasCategories: hasCreatorCategories.value,
          hasOldCreators: hasOldFormatCreators.value
        });
      };
      
      // Validate on setup
      validateData();
      
      // Initialize visible counts
      initializeVisibleCounts();
      
      // Handler for contacting a creator
      const onContactCreator = (creator) => {
        emit('contact-creator', creator);
      };
      
      // Auto-scroll to the response when it's generated
      watch(() => props.campaignData, (newData) => {
        if (newData && responseContainer.value) {
          // Reset visible counts when data changes
          initializeVisibleCounts();
          oldFormatVisibleCount.value = 3;
          
          // Small delay to ensure the DOM is updated
          setTimeout(() => {
            responseContainer.value.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }, 200);
        }
      }, { immediate: true });
      
      // When component is mounted, scroll to it if data is already available
      onMounted(() => {
        initializeVisibleCounts();
        
        if (props.campaignData && 
            props.campaignData.videoIdeas && 
            props.campaignData.videoIdeas.length > 0 &&
            responseContainer.value) {
          responseContainer.value.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      });
      
      return {
        responseContainer,
        onContactCreator,
        isDevelopment,
        hasCreatorCategories,
        hasOldFormatCreators,
        getBudgetFitClass,
        getVisibleCreators,
        hasMoreCreators,
        loadMoreCreators,
        getVisibleOldFormatCreators,
        hasMoreOldFormatCreators,
        loadMoreOldFormatCreators
      };
    }
  };
  </script>
  
  <style scoped>
  .response-section {
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow-y: auto;
    width: 100%;
    max-height: none;
    scroll-behavior: smooth;
  }
  
  .response-content {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .response-card {
    width: 100%;
    background-color: #f5f5f5;
    padding: 25px;
    border-radius: 8px;
    margin-bottom: 15px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .response-card h3 {
    margin-bottom: 18px;
    color: #282828;
    border-bottom: 2px solid #ff0000;
    padding-bottom: 10px;
    font-size: 1.3em;
  }
  
  .response-card ul {
    list-style-position: inside;
    padding-left: 15px;
  }
  
  .response-card li {
    margin-bottom: 12px;
    line-height: 1.5;
  }
  
  .creator-categories-section {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }
  
  .creator-category-card h3 {
    display: flex;
    align-items: center;
  }
  
  .creator-category-card h3::before {
    content: "";
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background-color: var(--primary-color);
    margin-right: 10px;
  }
  
  .creators-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .creator-item {
    padding: 20px;
    background-color: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .creator-header {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .creator-header h4 {
    margin: 0;
    color: var(--secondary-color);
    font-size: 1.1em;
  }
  
  .creator-stats {
    display: flex;
    gap: 15px;
    margin-top: 4px;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.9em;
    color: var(--dark-gray);
  }
  
  .stat-icon {
    font-size: 1.1em;
  }
  
  .stat-value {
    font-weight: 500;
  }
  
  .creator-description {
    margin: 0;
    font-size: 0.95em;
    line-height: 1.5;
    color: #555;
  }
  
  .budget-fit {
    font-size: 0.85em;
    padding: 4px 8px;
    border-radius: 12px;
    display: inline-block;
    font-weight: 500;
    margin-top: 5px;
  }
  
  .budget-fit-high {
    background-color: #d4edda;
    color: #155724;
  }
  
  .budget-fit-medium {
    background-color: #fff3cd;
    color: #856404;
  }
  
  .budget-fit-low {
    background-color: #f8d7da;
    color: #721c24;
  }
  
  .creator-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 5px;
  }
  
  .channel-link {
    color: var(--primary-color);
    text-decoration: none;
    font-weight: 500;
    font-size: 0.9em;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: color 0.2s;
  }
  
  .channel-link:hover {
    color: #cc0000;
    text-decoration: underline;
  }
  
  .contact-btn {
    padding: 8px 12px;
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s;
  }
  
  .contact-btn:hover {
    background-color: #cc0000;
  }
  
  .load-more-container {
    display: flex;
    justify-content: center;
    margin-top: 15px;
  }
  
  .load-more-btn {
    background-color: transparent;
    border: 1px dashed var(--dark-gray);
    color: var(--dark-gray);
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9em;
    transition: all 0.3s;
  }
  
  .load-more-btn:hover {
    background-color: #f8f9fa;
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
  
  .load-more-icon {
    font-size: 1.2em;
    font-weight: bold;
  }
  
  .empty-message {
    color: #6c757d;
    font-style: italic;
    padding: 10px 0;
  }
  
  .campaign-header {
    background: linear-gradient(to right, var(--primary-color), #cc0000);
    padding: 25px 20px;
    border-radius: var(--border-radius);
    margin-bottom: 25px;
    position: relative;
  }
  
  .campaign-header::after {
    content: "";
    position: absolute;
    bottom: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 4px;
    background-color: var(--primary-color);
    border-radius: 2px;
  }
  
  .campaign-header h2 {
    color: white;
    margin: 0;
    text-align: center;
    font-size: 1.8em;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    letter-spacing: 0.5px;
  }
  </style>