<!-- src/components/SavedCampaigns.vue -->
<template>
  <div class="saved-campaigns">
    <header class="page-header">
      <h1>Saved Campaigns</h1>
      <p>View and manage your previously created campaigns</p>
    </header>

    <div class="campaigns-grid" v-if="savedCampaigns.length > 0">
      <div v-for="campaign in savedCampaigns" :key="campaign.timestamp" class="campaign-card">
        <div class="campaign-header">
          <h3>{{ campaign.data.productUrl }}</h3>
          <span class="date">{{ formatDate(campaign.timestamp) }}</span>
        </div>
        
        <div class="campaign-details">
          <div class="detail-item">
            <span class="label">Budget:</span>
            <span class="value">{{ campaign.data.campaignBudget }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Timeline:</span>
            <span class="value">{{ campaign.data.timeline }}</span>
          </div>
          <div class="detail-item">
            <span class="label">Goals:</span>
            <span class="value">{{ campaign.data.campaignGoals }}</span>
          </div>
        </div>

        <div class="campaign-actions">
          <button @click="viewCampaign(campaign)" class="view-btn">
            <span class="icon">👁️</span>
            View Details
          </button>
          <button @click="deleteCampaign(campaign.timestamp)" class="delete-btn">
            <span class="icon">🗑️</span>
            Delete
          </button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">📝</div>
      <h2>No Saved Campaigns</h2>
      <p>Your saved campaigns will appear here</p>
      <router-link to="/home" class="create-btn">
        Create New Campaign
      </router-link>
    </div>

    <!-- Campaign Details Modal -->
    <div v-if="selectedCampaign" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>Campaign Details</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <div class="modal-body">
          <ResponseSection 
            :campaign-data="selectedCampaign.result"
            @contact-creator="showEmailTemplate"
          />
        </div>
      </div>
    </div>

    <!-- Email Template Modal -->
    <EmailTemplate
      :show="showEmailModal"
      :creator="selectedCreator"
      :campaign-info="{
        budget: selectedCampaign?.data.campaignBudget,
        timeline: selectedCampaign?.data.timeline,
        goals: selectedCampaign?.data.campaignGoals,
        productInfo: selectedCampaign?.data.productUrl
      }"
      @close="closeEmailModal"
      @copy="handleCopySuccess"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import ResponseSection from './ResponseSection.vue';
import EmailTemplate from './EmailTemplate.vue';

export default {
  name: 'SavedCampaigns',
  components: {
    ResponseSection,
    EmailTemplate
  },
  setup() {
    const savedCampaigns = ref([]);
    const selectedCampaign = ref(null);
    const showEmailModal = ref(false);
    const selectedCreator = ref({});

    onMounted(() => {
      loadSavedCampaigns();
    });

    const loadSavedCampaigns = () => {
      const campaigns = localStorage.getItem('savedCampaigns');
      if (campaigns) {
        savedCampaigns.value = JSON.parse(campaigns);
      }
    };

    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const viewCampaign = (campaign) => {
      selectedCampaign.value = campaign;
    };

    const closeModal = () => {
      selectedCampaign.value = null;
    };

    const deleteCampaign = (timestamp) => {
      if (confirm('Are you sure you want to delete this campaign?')) {
        savedCampaigns.value = savedCampaigns.value.filter(
          campaign => campaign.timestamp !== timestamp
        );
        localStorage.setItem('savedCampaigns', JSON.stringify(savedCampaigns.value));
      }
    };

    const showEmailTemplate = (creator) => {
      selectedCreator.value = creator;
      showEmailModal.value = true;
    };

    const closeEmailModal = () => {
      showEmailModal.value = false;
    };

    const handleCopySuccess = () => {
      alert('Email template copied to clipboard!');
    };

    return {
      savedCampaigns,
      selectedCampaign,
      showEmailModal,
      selectedCreator,
      formatDate,
      viewCampaign,
      closeModal,
      deleteCampaign,
      showEmailTemplate,
      closeEmailModal,
      handleCopySuccess
    };
  }
};
</script>

<style scoped>
.saved-campaigns {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  color: var(--primary-color);
  margin-bottom: 10px;
}

.page-header p {
  color: var(--dark-gray);
}

.campaigns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.campaign-card {
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.campaign-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.campaign-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.campaign-header h3 {
  color: var(--secondary-color);
  font-size: 1.1em;
  margin-right: 10px;
  word-break: break-all;
}

.date {
  color: var(--dark-gray);
  font-size: 0.9em;
  white-space: nowrap;
}

.campaign-details {
  margin-bottom: 20px;
}

.detail-item {
  margin-bottom: 8px;
  display: flex;
  align-items: flex-start;
}

.detail-item .label {
  font-weight: 500;
  color: var(--dark-gray);
  margin-right: 8px;
  min-width: 80px;
}

.detail-item .value {
  color: #333;
  word-break: break-word;
}

.campaign-actions {
  display: flex;
  gap: 10px;
}

.view-btn,
.delete-btn {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 0.9em;
  transition: background-color 0.3s;
}

.view-btn {
  background-color: var(--primary-color);
  color: white;
}

.view-btn:hover {
  background-color: #cc0000;
}

.delete-btn {
  background-color: #f8f9fa;
  color: #dc3545;
  border: 1px solid #dc3545;
}

.delete-btn:hover {
  background-color: #dc3545;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 40px;
  background-color: white;
  border-radius: var(--border-radius);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 3em;
  margin-bottom: 20px;
}

.empty-state h2 {
  color: var(--secondary-color);
  margin-bottom: 10px;
}

.empty-state p {
  color: var(--dark-gray);
  margin-bottom: 20px;
}

.create-btn {
  display: inline-block;
  padding: 10px 20px;
  background-color: var(--primary-color);
  color: white;
  border-radius: 4px;
  text-decoration: none;
  transition: background-color 0.3s;
}

.create-btn:hover {
  background-color: #cc0000;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  overflow-y: auto;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: var(--border-radius);
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 1;
}

.modal-header h2 {
  color: var(--secondary-color);
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: var(--dark-gray);
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-body {
  padding: 20px;
}

/* Responsive styles */
@media (max-width: 768px) {
  .campaigns-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    margin: 10px;
  }
}
</style>