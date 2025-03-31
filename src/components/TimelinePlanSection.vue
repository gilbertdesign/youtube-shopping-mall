<template>
  <div class="timeline-plan-section">
    <div v-if="isLoading" class="loading-container">
      <LoadingSpinner message="Generating timeline recommendations..." />
    </div>
    
    <div v-else-if="timelineData" class="timeline-plan-content">
      <!-- Header Section -->
      <div class="timeline-header">
        <h2>{{ timelineData.timelinePlan.title }}</h2>
        <div class="timeline-badge">{{ timeline }}</div>
      </div>
      
      <p class="timeline-overview">{{ timelineData.timelinePlan.overview }}</p>
      
      <!-- Campaign Phases Timeline with Accordion -->
      <div class="timeline-card">
        <h3>Campaign Timeline</h3>
        <div class="timeline-phases">
          <div 
            v-for="(phase, index) in timelineData.timelinePlan.phases" 
            :key="'phase-'+index" 
            class="timeline-phase"
          >
            <div 
              class="phase-header" 
              @click="togglePhase(index)"
              :class="{ 'expanded': expandedPhases[index] }"
            >
              <div class="phase-title">
                <h4>{{ phase.name }}</h4>
                <span class="phase-duration">{{ phase.duration }}</span>
              </div>
              <div class="expand-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
            <div class="phase-content" v-show="expandedPhases[index]">
              <p class="phase-description">{{ phase.description }}</p>
              <ul class="phase-activities">
                <li v-for="(activity, actIndex) in phase.activities" :key="'activity-'+index+'-'+actIndex">
                  {{ activity }}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Creator Collaboration Strategy -->
      <div class="timeline-card collaboration-card">
        <h3>Creator Collaboration Strategy</h3>
        <div class="collaboration-strategy">
          <p>{{ timelineData.creatorCollaboration.strategy }}</p>
          
          <div class="collaboration-details">
            <div class="collaboration-section">
              <h4>Contract Recommendations</h4>
              <ul>
                <li v-for="(rec, index) in timelineData.creatorCollaboration.contractRecommendations" 
                    :key="'contract-'+index">
                  {{ rec }}
                </li>
              </ul>
            </div>
            
            <div class="collaboration-section">
              <h4>Content Strategy</h4>
              <ul>
                <li v-for="(rec, index) in timelineData.creatorCollaboration.contentRecommendations" 
                    :key="'content-'+index">
                  {{ rec }}
                </li>
              </ul>
            </div>
          </div>
          
          <div class="communication-cadence">
            <h4>Communication Schedule</h4>
            <p>{{ timelineData.creatorCollaboration.communicationCadence }}</p>
          </div>
        </div>
      </div>
      
      <!-- Timeline-specific Tips -->
      <div class="timeline-card tips-card">
        <h3>Timeline-Specific Tips</h3>
        <ul class="timeline-tips">
          <li v-for="(tip, index) in timelineData.timelineSpecificTips" :key="'tip-'+index">
            {{ tip }}
          </li>
        </ul>
      </div>
      
      <!-- Key Performance Indicators -->
      <div class="timeline-card kpi-card">
        <h3>Key Performance Indicators</h3>
        <ul class="timeline-kpis">
          <li v-for="(kpi, index) in timelineData.keyPerformanceIndicators" :key="'kpi-'+index">
            {{ kpi }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, reactive } from 'vue';
import LoadingSpinner from './LoadingSpinner.vue';
import GoogleAIService from '../services/googleAI-new.js';
import { getApiKey } from '../utils/envConfig';

export default {
  name: 'TimelinePlanSection',
  components: {
    LoadingSpinner
  },
  props: {
    timeline: {
      type: String,
      required: true
    },
    campaignData: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const apiKey = getApiKey();
    const googleAI = new GoogleAIService(apiKey);
    const timelineData = ref(null);
    const isLoading = ref(true);
    const error = ref(null);
    
    // Track expanded phases for accordion
    const expandedPhases = reactive({});
    
    // Toggle phase expansion
    const togglePhase = (index) => {
      expandedPhases[index] = !expandedPhases[index];
    };
    
    // Function to generate timeline recommendations
    const generateTimelineRecommendations = async () => {
      if (!props.timeline) {
        error.value = 'No timeline provided';
        isLoading.value = false;
        return;
      }
      
      isLoading.value = true;
      
      try {
        // Generate timeline-specific recommendations
        const result = await googleAI.generateTimelineRecommendations(
          props.timeline, 
          props.campaignData
        );
        
        timelineData.value = result;
        
        // Set the first phase to expanded by default
        if (result && result.timelinePlan && result.timelinePlan.phases && result.timelinePlan.phases.length > 0) {
          expandedPhases[0] = true;
        }
      } catch (err) {
        console.error('Error generating timeline recommendations:', err);
        error.value = err.message || 'Failed to generate recommendations';
      } finally {
        isLoading.value = false;
      }
    };
    
    // Generate recommendations when timeline changes
    watch(() => props.timeline, (newValue) => {
      if (newValue) {
        generateTimelineRecommendations();
      }
    }, { immediate: false });
    
    // Generate on component mount
    onMounted(() => {
      generateTimelineRecommendations();
    });
    
    return {
      timelineData,
      isLoading,
      error,
      expandedPhases,
      togglePhase
    };
  }
};
</script>

<style scoped>
.timeline-plan-section {
  width: 100%;
  margin-bottom: 30px;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.timeline-plan-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.timeline-header h2 {
  color: var(--primary-color);
  margin: 0;
  font-size: 1.6rem;
}

.timeline-badge {
  background-color: var(--primary-color);
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 500;
}

.timeline-overview {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #333;
  margin-bottom: 20px;
}

.timeline-card {
  background-color: white;
  border-radius: var(--border-radius);
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}

.timeline-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.timeline-card h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 1.3rem;
  color: var(--secondary-color);
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.timeline-phases {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.timeline-phase {
  position: relative;
  padding-left: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #eaeaea;
  transition: all 0.3s ease;
}

.timeline-phase:not(:last-child)::before {
  content: '';
  position: absolute;
  top: 40px;
  left: 15px;
  width: 0;
  height: calc(100% - 40px);
  background-color: #e0e0e0;
  z-index: 0;
}

.phase-header {
  display: flex;
  align-items: center;
  padding: 15px 20px 15px 0;
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s ease;
}

.phase-header:hover {
  background-color: #f0f0f0;
}

.phase-header.expanded {
  background-color: #f0f0f0;
  border-bottom: 1px solid #eaeaea;
}

.phase-header.expanded .expand-icon svg {
  transform: rotate(180deg);
}

.phase-title {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-left: 10px;
}

.phase-title h4 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--secondary-color);
}

.phase-duration {
  font-size: 0.9rem;
  color: var(--dark-gray);
  margin-top: 3px;
}

.expand-icon {
  color: var(--dark-gray);
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
}

.phase-content {
  padding: 0 20px 20px 10px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.phase-description {
  margin: 10px 0 15px;
  line-height: 1.5;
  color: #333;
}

.phase-activities {
  margin: 0;
  padding-left: 20px;
}

.phase-activities li {
  margin-bottom: 10px;
  line-height: 1.5;
}

/* Collaboration section */
.collaboration-card {
  border-left: 4px solid #4a6fa5;
}

.collaboration-strategy p {
  margin-top: 0;
  line-height: 1.6;
  font-size: 1.05rem;
  color: #333;
}

.collaboration-details {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  margin: 20px 0;
}

.collaboration-section {
  flex: 1;
  min-width: 250px;
}

.collaboration-section h4 {
  color: var(--secondary-color);
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1.1rem;
}

.collaboration-section ul {
  margin: 0;
  padding-left: 20px;
}

.collaboration-section li {
  margin-bottom: 8px;
  line-height: 1.5;
}

.communication-cadence {
  margin-top: 20px;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: var(--border-radius);
}

.communication-cadence h4 {
  color: var(--secondary-color);
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.1rem;
}

.communication-cadence p {
  margin: 0;
  line-height: 1.5;
}

/* Tips and KPIs cards */
.tips-card {
  border-left: 4px solid #6b8f71;
}

.kpi-card {
  border-left: 4px solid #b25158;
}

.timeline-tips,
.timeline-kpis {
  margin: 0;
  padding-left: 20px;
}

.timeline-tips li,
.timeline-kpis li {
  margin-bottom: 12px;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .collaboration-details {
    flex-direction: column;
    gap: 20px;
  }
}
</style> 