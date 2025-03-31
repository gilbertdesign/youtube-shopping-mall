<!-- src/components/ResponseSection.vue -->
<template>
    <div class="response-section" ref="responseContainer">
      <div class="response-content">
        <!-- Campaign Name Header -->
        <div class="campaign-header" v-if="campaignData.campaignName">
          <h2>{{ campaignData.campaignName }}</h2>
        </div>
        
        <!-- Strategy Summary Card - NEW SECTION -->
        <div class="response-card strategy-summary-card" v-if="campaignInputs">
          <h3>Campaign Strategy</h3>
          
          <div class="strategy-summary">
            <div class="strategy-item">
              <div class="strategy-label">
                <span class="strategy-icon">🎯</span>
                Your Goals:
              </div>
              <div class="strategy-value">{{ truncateText(campaignInputs.goals, 150) }}</div>
            </div>
            
            <div class="strategy-item">
              <div class="strategy-label">
                <span class="strategy-icon">💰</span>
                Budget:
              </div>
              <div class="strategy-value">{{ campaignInputs.budget }}</div>
              <div class="strategy-note" v-if="budgetRecommendation">
                {{ budgetRecommendation }}
              </div>
            </div>
            
            <div class="strategy-item">
              <div class="strategy-label">
                <span class="strategy-icon">⏱️</span>
                Timeline:
              </div>
              <div class="strategy-value">{{ campaignInputs.timeline }}</div>
            </div>
            
            <div class="strategy-recommendations">
              <h4>Strategic Approach</h4>
              <ul class="strategy-points">
                <li v-for="(point, index) in strategyPoints" :key="'strategy-'+index">
                  {{ point }}
                </li>
              </ul>
            </div>
          </div>
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
                      <span class="stat-value">{{ creator.averageViews || 'Unknown' }} views</span>
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
                    <span class="stat-value">{{ creator.averageViews || 'Unknown' }} views</span>
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
      },
      campaignInputs: {
        type: Object,
        default: null
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
      
      // Get budget recommendation based on budget range
      const budgetRecommendation = computed(() => {
        if (!props.campaignInputs?.budget) return null;
        
        const budget = props.campaignInputs.budget;
        if (budget.includes('$1,000 - $5,000')) {
          return 'Ideal for micro-influencers (50K-200K subscribers)';
        } else if (budget.includes('$5,000 - $10,000') || budget.includes('$10,000 - $25,000')) {
          return 'Great for mid-tier creators (200K-1M subscribers)';
        } else if (budget.includes('$25,000') || budget.includes('$50,000')) {
          return 'Perfect for larger creators (1M+ subscribers)';
        }
        return null;
      });
      
      // Generate strategy points based on campaign inputs
      const strategyPoints = computed(() => {
        if (!props.campaignInputs) return [];
        
        const points = [];
        const budget = props.campaignInputs.budget || '';
        const timeline = props.campaignInputs.timeline || '';
        const goals = props.campaignInputs.goals || '';
        
        // Budget-based recommendations
        if (budget.includes('$1,000 - $5,000')) {
          points.push('Focus on 5-10 micro-influencers for broader reach with lower budget');
          points.push('Prioritize engagement rates over subscriber count for better ROI');
        } else if (budget.includes('$5,000 - $10,000')) {
          points.push('Balance between mid-tier creators and micro-influencers for optimal impact');
          points.push('Allocate 60% of budget to top performers, 40% to experimental creators');
        } else if (budget.includes('$10,000 - $25,000')) {
          points.push('Invest in 3-5 mid-tier creators with proven track records');
          points.push('Allocate budget for production quality improvements and potential exclusivity');
        } else if (budget.includes('$25,000 - $50,000') || budget.includes('$50,000+')) {
          points.push('Partner with 1-2 premium creators (1M+ subscribers) as campaign anchors');
          points.push('Supplement with mid-tier creators for comprehensive coverage');
        }
        
        // Timeline recommendations
        if (timeline.includes('1-2 weeks')) {
          points.push('Plan for quick turnaround content like unboxings and first impressions');
        } else if (timeline.includes('1 month')) {
          points.push('Aim for a mix of quick content and more detailed reviews/tutorials');
        } else if (timeline.includes('2-3 months')) {
          points.push('Develop multi-part series and before/after content to show long-term value');
        } else if (timeline.includes('3-6 months') || timeline.includes('6+')) {
          points.push('Structure as a phased campaign with initial reviews and follow-up content');
        }
        
        // Goal-based points
        if (goals.toLowerCase().includes('brand awareness')) {
          points.push('Prioritize creators with larger audiences to maximize reach');
        }
        if (goals.toLowerCase().includes('sales') || goals.toLowerCase().includes('conversion')) {
          points.push('Focus on creators with high engagement and conversion track records');
        }
        if (goals.toLowerCase().includes('engagement') || goals.toLowerCase().includes('community')) {
          points.push('Select creators with highly engaged communities and strong comment sections');
        }
        if (goals.toLowerCase().includes('product launch') || goals.toLowerCase().includes('new product')) {
          points.push('Create buzz with teaser content leading up to full reviews at launch');
        }
        
        // Return 3-5 strategic points
        return points.slice(0, 5);
      });
      
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
        // Increase by 3 or show all remaining
        const totalCreators = props.campaignData.recommendedCreators.length;
        oldFormatVisibleCount.value = Math.min(oldFormatVisibleCount.value + 3, totalCreators);
      };
      
      // Helper function for getting the right CSS class for budget fit
      const getBudgetFitClass = (budgetFit) => {
        if (!budgetFit) return '';
        const lowerBudgetFit = budgetFit.toLowerCase();
        if (lowerBudgetFit.includes('high')) {
          return 'high-fit';
        } else if (lowerBudgetFit.includes('medium')) {
          return 'medium-fit';
        } else {
          return 'low-fit';
        }
      };
      
      // Truncate text to a certain length
      const truncateText = (text, maxLength) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
      };
      
      // Contact creator handler
      const onContactCreator = (creator) => {
        emit('contact-creator', creator);
      };
      
      // Initialize visible counts when component is mounted
      onMounted(() => {
        initializeVisibleCounts();
      });
      
      // Watch for changes in campaign data and recalculate visible counts
      watch(() => props.campaignData, () => {
        initializeVisibleCounts();
      }, { deep: true });
      
      return {
        responseContainer,
        hasCreatorCategories,
        hasOldFormatCreators,
        getVisibleCreators,
        hasMoreCreators,
        loadMoreCreators,
        getVisibleOldFormatCreators,
        hasMoreOldFormatCreators,
        loadMoreOldFormatCreators,
        getBudgetFitClass,
        onContactCreator,
        isDevelopment,
        budgetRecommendation,
        strategyPoints,
        truncateText
      };
    }
  };
  </script>
  
  <style scoped>
  .response-section {
    width: 100%;
  }
  
  .response-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .campaign-header {
    text-align: center;
    margin-bottom: 10px;
  }
  
  .campaign-header h2 {
    font-size: 1.8rem;
    color: var(--primary-color);
    margin: 0;
    padding-bottom: 15px;
    position: relative;
  }
  
  .campaign-header h2::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 3px;
    background-color: var(--primary-color);
    border-radius: 1.5px;
  }
  
  .response-card {
    background-color: white;
    border-radius: var(--border-radius);
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    transition: all 0.3s ease;
  }
  
  .response-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  }
  
  .response-card h3 {
    margin-top: 0;
    margin-bottom: 15px;
    font-size: 1.2rem;
    color: var(--secondary-color);
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  }
  
  .response-card ul {
    margin: 0;
    padding-left: 20px;
  }
  
  .response-card li {
    margin-bottom: 10px;
    line-height: 1.5;
  }
  
  .empty-message {
    color: var(--dark-gray);
    font-style: italic;
    margin: 10px 0;
  }
  
  .creator-categories-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  .creators-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .creator-item {
    border: 1px solid #eee;
    border-radius: var(--border-radius);
    padding: 15px;
    background-color: #fafafa;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    position: relative;
  }
  
  .creator-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.08);
  }
  
  .creator-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .creator-header h4 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--secondary-color);
  }
  
  .creator-stats {
    display: flex;
    gap: 15px;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.9rem;
    color: var(--dark-gray);
  }
  
  .creator-description {
    margin: 10px 0 15px;
    font-size: 0.95rem;
    line-height: 1.5;
    color: #333;
  }
  
  .creator-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 15px;
  }
  
  .channel-link {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #1a73e8;
    font-size: 0.9rem;
    text-decoration: none;
    padding: 8px 12px;
    border-radius: var(--border-radius);
    transition: background-color 0.2s;
  }
  
  .channel-link:hover {
    background-color: rgba(26, 115, 232, 0.1);
    text-decoration: underline;
  }
  
  .contact-btn {
    background-color: var(--primary-color);
    color: white;
    border: none;
    padding: 8px 12px;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s;
  }
  
  .contact-btn:hover {
    background-color: #cc0000;
  }
  
  .load-more-container {
    display: flex;
    justify-content: center;
    margin-top: 10px;
  }
  
  .load-more-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background-color: transparent;
    border: 1px solid #ddd;
    padding: 8px 15px;
    border-radius: 20px;
    color: var(--dark-gray);
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  
  .load-more-btn:hover {
    background-color: #f5f5f5;
    border-color: #ccc;
  }
  
  .load-more-icon {
    font-size: 1.1rem;
    line-height: 1;
  }
  
  .budget-fit {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 500;
    margin-top: 5px;
  }
  
  .high-fit {
    background-color: #d4edda;
    color: #155724;
  }
  
  .medium-fit {
    background-color: #fff3cd;
    color: #856404;
  }
  
  .low-fit {
    background-color: #f8d7da;
    color: #721c24;
  }
  
  /* Strategy Summary Card Styles - NEW */
  .strategy-summary-card {
    border-left: 4px solid var(--primary-color);
  }
  
  .strategy-summary {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .strategy-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
  
  .strategy-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--secondary-color);
  }
  
  .strategy-icon {
    font-size: 1.2rem;
  }
  
  .strategy-value {
    padding-left: 30px;
    color: #333;
    line-height: 1.5;
  }
  
  .strategy-note {
    padding-left: 30px;
    font-size: 0.9rem;
    color: var(--dark-gray);
    font-style: italic;
    margin-top: 2px;
  }
  
  .strategy-recommendations {
    margin-top: 10px;
    background-color: #f9f9f9;
    border-radius: var(--border-radius);
    padding: 15px;
  }
  
  .strategy-recommendations h4 {
    margin: 0 0 10px 0;
    color: var(--primary-color);
    font-size: 1.1rem;
  }
  
  .strategy-points {
    margin: 0;
    padding-left: 25px;
  }
  
  .strategy-points li {
    margin-bottom: 8px;
    line-height: 1.5;
  }
  
  @media (max-width: 768px) {
    .creator-header {
      flex-direction: column;
      align-items: flex-start;
    }
    
    .creator-stats {
      margin-top: 5px;
    }
    
    .creator-footer {
      flex-direction: column;
      align-items: stretch;
    }
    
    .channel-link, .contact-btn {
      text-align: center;
    }
  }
  </style>