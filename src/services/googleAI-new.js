// services/googleAI.js
import config from '../utils/envConfig';

/**
 * Service class for integrating with Google's Generative AI (Gemini)
 */
class GoogleAIService {
    /**
     * Constructor
     * @param {string} apiKey - Google AI API key
     */
    constructor(apiKey = config.apiKey) {
      this.apiKey = apiKey;
      this.useMock = !apiKey || config.mockEnabled;
      this.isInitialized = false;
      
      console.log('[GoogleAIService] Initialization', { 
        hasApiKey: !!this.apiKey, 
        mockEnabled: config.mockEnabled,
        usingMock: this.useMock
      });
      
      if (!this.useMock) {
        this.initializeGemini().catch(error => {
          console.error('[GoogleAIService] Failed to initialize Gemini API:', error);
          this.useMock = true;
        });
      } else {
        console.log('[GoogleAIService] Using mock Gemini implementation (no API key provided or mock mode enabled)');
      }
    }
  
    /**
     * Initialize the Gemini API
     */
    async initializeGemini() {
      try {
        console.log('[GoogleAIService] Initializing Gemini API...');
        // Dynamically import the Google Generative AI SDK
        const module = await import('@google/generative-ai');
        const GoogleGenerativeAI = module.GoogleGenerativeAI;
        
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        this.isInitialized = true;
        console.log('[GoogleAIService] Gemini API initialized successfully');
      } catch (error) {
        this.isInitialized = false;
        console.error('[GoogleAIService] Failed to initialize Gemini API:', error);
        this.useMock = true;
        console.log('[GoogleAIService] Falling back to mock implementation due to initialization error');
        throw error; // Rethrow for handling by caller
      }
    }
  
    /**
     * Check if the service is ready to use
     * @returns {Promise<boolean>} - True if ready or mock mode enabled
     */
    async isReady() {
      if (this.useMock) return true;
      if (!this.isInitialized) {
        try {
          await this.initializeGemini();
          return true;
        } catch (error) {
          return false;
        }
      }
      return true;
    }
  
    /**
     * Generate a campaign plan based on user inputs
     * @param {Object} campaignData - The form data with campaign details
     * @returns {Promise<Object>} - The structured campaign response
     */
    async generateCampaignPlan(campaignData) {
      try {
        // Ensure the service is ready
        if (!await this.isReady()) {
          throw new Error('Service not initialized');
        }
        
        if (this.useMock) {
          console.log('[GoogleAIService] Using mock data generator - bypassing Gemini API call');
          console.log('[GoogleAIService] Mock status:', { 
            hasApiKey: !!this.apiKey, 
            isInitialized: this.isInitialized, 
            mockEnabled: config.mockEnabled 
          });
          return this.generateMockResponse(campaignData);
        }
        
        console.log('[GoogleAIService] Calling Gemini API with data:', {
          campaignGoals: campaignData.campaignGoals,
          budget: campaignData.campaignBudget,
          timeline: campaignData.timeline,
          hasProductAnalysis: !!campaignData.productAnalysis
        });
        
        // Create a prompt based on the user input
        const prompt = this.createPrompt(campaignData);
        
        console.log('[GoogleAIService] Sending structured request to Gemini');
        
        // Try to use the Gemini API
        try {
          // Generate content with the model
          const result = await this.model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              topP: 0.95,
              topK: 32,
              maxOutputTokens: 8192,
              responseMimeType: "application/json"
            },
            safetySettings: [
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_ONLY_HIGH"
              }
            ]
          });
          
          // Check for error response
          if (!result || !result.response) {
            console.error('[GoogleAIService] Empty response received from Gemini API');
            throw new Error('Empty response received from Gemini API');
          }
          
          console.log('[GoogleAIService] Received response from Gemini - SUCCESS');
          const response = result.response;
          const text = response.text();
          
          // Log sample of response
          console.log('[GoogleAIService] Gemini response preview:', text.substring(0, 200) + '...');
          
          // Parse the text response into structured data
          const parsedResponse = this.parseResponse(text);
          return this.normalizeResponseStructure(parsedResponse);
        } catch (error) {
          console.error('[GoogleAIService] Error generating campaign plan with Gemini API:', error);
          console.error('[GoogleAIService] Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack?.substring(0, 500)
          });
          // Add specific error info
          throw Object.assign(
            new Error(`Failed to generate campaign plan: ${error.message}`), 
            { originalError: error, cause: 'API_ERROR' }
          );
        }
      } catch (error) {
        console.error('[GoogleAIService] Error in generateCampaignPlan:', error);
        // Fallback to mock implementation on error
        console.log('[GoogleAIService] Error occurred, falling back to mock data');
        return this.generateMockResponse(campaignData);
      }
    }
  
    /**
     * Create a structured prompt for the AI model
     * @param {Object} data - The campaign form data
     * @returns {string} - The formatted prompt
     */
    createPrompt(data) {
      // Format product analysis data if available
      let productAnalysisText = '';
      if (data.productAnalysis) {
        const pa = data.productAnalysis.extractedInfo;
        productAnalysisText = `
        Product Analysis:
        - Category: ${pa.category}
        - Price Range: ${pa.estimatedPrice || 'Not available'}
        - Target Audience: ${pa.targetDemographic}
        - Key Features: ${pa.keyFeatures ? pa.keyFeatures.join(', ') : 'N/A'}
        
        Suggested Creator Guidance:
        - Recommended Creator Types: ${pa.recommendedCreatorTypes ? pa.recommendedCreatorTypes.join(', ') : 'N/A'}
        - Suggested Content Styles: ${pa.suggestedContentStyles ? pa.suggestedContentStyles.join(', ') : 'N/A'}
        
        Recommended YouTube Creators from Analysis:
        ${pa.recommendedCreators && pa.recommendedCreators.length > 0 ? 
          pa.recommendedCreators.map(creator => 
            `- ${creator.name} (${creator.subscribers}): ${creator.description}`
          ).join('\n        ') 
          : 'No specific creators recommended from analysis'
        }
        `;
      }
      
      // Extract budget range numbers for creator matching
      const budgetRange = this.parseBudgetRange(data.campaignBudget);
      
      // Extract timeline for specific strategic guidance
      const timeline = data.timeline || '';
      let timelineGuidance = '';
      
      if (timeline.includes('1-2 weeks')) {
        timelineGuidance = `
        TIMELINE GUIDANCE (1-2 WEEKS):
        - Focus on quick-turnaround content like unboxings and first impressions
        - Recommend creators known for rapid production and publishing
        - Suggest content that can be created and published within days
        - Include metrics that can show immediate impact`;
      } else if (timeline.includes('1 month')) {
        timelineGuidance = `
        TIMELINE GUIDANCE (1 MONTH):
        - Balance quick content with more detailed reviews
        - Include a mix of short-form and long-form content suggestions
        - Recommend creators who can dedicate appropriate time to quality content
        - Structure campaign with initial and follow-up content phases`;
      } else if (timeline.includes('2-3 months')) {
        timelineGuidance = `
        TIMELINE GUIDANCE (2-3 MONTHS):
        - Suggest developing multi-part video series or before/after content
        - Recommend creators who can commit to longer-term partnerships
        - Include content ideas that build upon each other over time
        - Structure campaign with distinct phases showing product impact over time`;
      } else if (timeline.includes('3-6 months') || timeline.includes('6+')) {
        timelineGuidance = `
        TIMELINE GUIDANCE (${timeline}):
        - Design a comprehensive multi-phase campaign structure
        - Recommend creators suitable for long-term brand ambassadorship
        - Include ideas for seasonal content if applicable
        - Suggest content that evolves with product usage over extended periods`;
      }
      
      // Extract goals for specific strategic guidance
      const goals = data.campaignGoals || '';
      let goalGuidance = '';
      
      if (goals.toLowerCase().includes('brand awareness') || goals.toLowerCase().includes('visibility')) {
        goalGuidance += `
        BRAND AWARENESS FOCUS:
        - Prioritize creators with larger audiences for maximum reach
        - Include metrics focused on impressions, views, and brand lift
        - Suggest content formats that showcase brand identity and values`;
      }
      
      if (goals.toLowerCase().includes('sales') || goals.toLowerCase().includes('conversion')) {
        goalGuidance += `
        SALES/CONVERSION FOCUS:
        - Recommend creators with high engagement and conversion track records
        - Include clear calls-to-action in content ideas
        - Suggest content that demonstrates product value proposition
        - Focus on metrics tied to conversion rates and ROI`;
      }
      
      if (goals.toLowerCase().includes('engagement') || goals.toLowerCase().includes('community')) {
        goalGuidance += `
        ENGAGEMENT/COMMUNITY FOCUS:
        - Select creators with highly engaged communities and active comment sections
        - Suggest content that encourages viewer participation and sharing
        - Include metrics focused on engagement rates and community growth
        - Recommend content formats that build community around the product`;
      }
      
      if (goals.toLowerCase().includes('product launch') || goals.toLowerCase().includes('new product')) {
        goalGuidance += `
        PRODUCT LAUNCH FOCUS:
        - Structure campaign with pre-launch teaser content
        - Include day-of-launch coordination strategies
        - Suggest follow-up content to maintain momentum
        - Focus on metrics related to product awareness and initial reception`;
      }
      
      return `Context: You're a marketing specialist, skilled at connecting YouTube creators and merchants. You excel at crafting marketing and ad campaigns to help merchants find the right creators for successful collaborations.
  
  Objective: Provide personalized recommendations to guide merchants in building marketing and ad campaigns with YouTube creators from scratch.
  
  IMPORTANT CONTEXT:
  First, the merchant provided a product URL for AI analysis. Based on that analysis, they've now provided additional campaign details.
  Your goal is to use BOTH the product analysis data AND their campaign goals to create a highly tailored campaign plan.
  
  Create a structured YouTube creator marketing campaign plan based on the following details:
      
  Campaign Goals: ${data.campaignGoals}
  Target Audience: ${data.targetAudience || (data.productAnalysis ? data.productAnalysis.extractedInfo.targetDemographic : 'Not specified')}
  Creator Details: ${data.creatorDetails || 'Not specified'}
  Campaign Budget: ${data.campaignBudget}
  Timeline: ${data.timeline}
  Product URL: ${data.productInfo || 'Not provided'}
  ${productAnalysisText}
  
  BUDGET GUIDANCE:
  The merchant's budget is ${data.campaignBudget}. Based on this budget:
  - For budgets under $5,000: Recommend micro-influencers (50K-200K subscribers)
  - For budgets $5,000-$25,000: Recommend mid-tier creators (200K-1M subscribers)
  - For budgets over $25,000: Recommend larger creators (1M+ subscribers)
  
  ${timelineGuidance}
  
  ${goalGuidance}
  
  IMPORTANT GUIDANCE:
  1. Focus on creating a campaign that highlights the specific product features identified in the analysis
  2. Group recommended creators by category/niche (e.g., Tech Reviewers, Beauty Influencers, Lifestyle Vloggers)
  3. Include AT LEAST 5 creators for EACH category, and recommend at least 3-4 different categories relevant to the product
  4. For each creator, include realistic subscriber counts and average view counts that align with the campaign budget
  5. Suggest video concepts that utilize the content styles most appropriate for this product
  6. Include specific ways to measure campaign success based on the product type and campaign goals
  7. DIRECTLY connect your recommendations to the merchant's specific goals, budget, and timeline throughout the plan
  
  IMPORTANT: You MUST format your response as valid JSON with the following structure exactly:
  {
    "campaignName": "Create a catchy campaign name based on the product",
    "videoIdeas": [
      "Video idea 1",
      "Video idea 2",
      "Video idea 3",
      "Video idea 4",
      "Video idea 5"
    ],
    "trackingMetrics": [
      "Tracking metric 1",
      "Tracking metric 2",
      "Tracking metric 3",
      "Tracking metric 4",
      "Tracking metric 5"
    ],
    "keysToSuccess": [
      "Key to success 1",
      "Key to success 2",
      "Key to success 3",
      "Key to success 4",
      "Key to success 5"
    ],
    "creatorCategories": [
      {
        "categoryName": "Category 1 (e.g., Tech Reviewers)",
        "creators": [
      {
        "name": "Creator name 1",
        "description": "Detailed description about why this creator is a good fit",
            "channelUrl": "YouTube channel URL",
            "subscribers": "1.2M subscribers",
            "averageViews": "150K views",
            "budgetFit": "High Budget Fit"
          },
          // IMPORTANT: Include at least 5 creators per category, more is better
          // Include more creator objects with the same structure
        ]
      },
      // Include 3-4 categories with the same structure, each with at least 5 creators
    ]
  }
  
  Style and Tone:
  - Use clear, concise language with everyday words and short sentences
  - Aim for a 9th-grade reading level, keeping it simple yet engaging
  - Be a friendly and professional campaign expert
  - Express confidence in the merchant's ability to create a successful campaign
  
  Ensure all recommendations are relevant to the information provided. If product analysis is provided, use the key features to inform your video ideas and creator recommendations.
  
  Remember: Your entire response must be valid JSON following the exact structure above, with no additional text before or after.`;
    }
  
    /**
     * Parse the budget range to get min and max values
     * @param {string} budgetString - Budget range string (e.g., "$5,000 - $10,000")
     * @returns {Object} - Min and max budget values
     */
    parseBudgetRange(budgetString) {
      if (!budgetString) return { min: 0, max: 0 };
      
      try {
        // Extract numbers from the budget string
        const numbers = budgetString.match(/\$?([\d,]+)/g) || [];
        
        if (numbers.length >= 2) {
          const min = parseInt(numbers[0].replace(/[$,]/g, ''));
          const max = parseInt(numbers[1].replace(/[$,]/g, ''));
          return { min, max };
        } else if (numbers.length === 1) {
          // Handle case like "$50,000+"
          const baseNumber = parseInt(numbers[0].replace(/[$,]/g, ''));
          return budgetString.includes('+') ? 
            { min: baseNumber, max: baseNumber * 2 } : 
            { min: baseNumber, max: baseNumber };
        }
      } catch (error) {
        console.error('Error parsing budget range:', error);
      }
      
      return { min: 0, max: 0 };
    }
  
    /**
     * Parse the text response from the AI into structured data
     * @param {string} text - The AI response text
     * @returns {Object} - Structured campaign data
     */
    parseResponse(text) {
      try {
        // Try to parse as JSON first
        console.log('Attempting to parse Gemini response as JSON');
        
        // Clean the response: remove any non-JSON content
        let cleanedText = text;
        
        // Try to extract just the JSON part
        const jsonMatch = text.match(/(\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[0]) {
          cleanedText = jsonMatch[0];
          console.log('Extracted JSON-like structure from response');
        }
        
        try {
          // Parse the cleaned text
          const parsedData = JSON.parse(cleanedText);
          console.log('Successfully parsed response as JSON');
          
          // Check for creator data structure
          if (parsedData.recommendedCreators && Array.isArray(parsedData.recommendedCreators)) {
            const sampleCreator = parsedData.recommendedCreators[0];
            console.log('Sample creator data:', JSON.stringify(sampleCreator, null, 2));
            
            // Check if subscriber and view data exists
            if (sampleCreator) {
              console.log('Creator has subscriber data:', !!sampleCreator.subscribers);
              console.log('Creator has view data:', !!sampleCreator.averageViews);
            }
          }
          
          return parsedData;
        } catch (jsonError) {
          console.error('JSON parsing failed:', jsonError.message);
          
          // Try to fix common JSON issues
          try {
            // Replace single quotes with double quotes
            const fixedQuotes = cleanedText.replace(/'/g, '"');
            const parsedWithFixedQuotes = JSON.parse(fixedQuotes);
            console.log('Successfully parsed JSON after fixing quotes');
            return parsedWithFixedQuotes;
          } catch (fixedError) {
            console.error('Failed to parse JSON after fixing quotes:', fixedError.message);
          }
          
          // If all JSON parsing attempts fail, fall back to text extraction
          console.log('Falling back to structured data extraction from text');
          return this.extractStructuredData(text);
        }
      } catch (error) {
        console.error('Error in parseResponse:', error);
        return this.extractStructuredData(text);
      }
    }
    
    /**
     * Normalize the response structure to ensure it matches what ResponseSection expects
     * @param {Object} parsedResponse - The parsed response from Gemini
     * @returns {Object} - Normalized response structure
     */
    normalizeResponseStructure(parsedResponse) {
      // Create a base structure with default empty arrays
      const normalizedResponse = {
        campaignName: parsedResponse.campaignName || 'YouTube Creator Campaign',
        videoIdeas: [],
        trackingMetrics: [],
        keysToSuccess: [],
        creatorCategories: []
      };
      
      // Normalize videoIdeas
      if (parsedResponse.videoIdeas && Array.isArray(parsedResponse.videoIdeas)) {
        normalizedResponse.videoIdeas = parsedResponse.videoIdeas
          .filter(item => item && typeof item === 'string')
          .slice(0, 5);
      }
      
      // Normalize trackingMetrics
      if (parsedResponse.trackingMetrics && Array.isArray(parsedResponse.trackingMetrics)) {
        normalizedResponse.trackingMetrics = parsedResponse.trackingMetrics
          .filter(item => item && typeof item === 'string')
          .slice(0, 5);
      }
      
      // Normalize keysToSuccess
      if (parsedResponse.keysToSuccess && Array.isArray(parsedResponse.keysToSuccess)) {
        normalizedResponse.keysToSuccess = parsedResponse.keysToSuccess
          .filter(item => item && typeof item === 'string')
          .slice(0, 5);
      }
      
      // Normalize creator categories
      if (parsedResponse.creatorCategories && Array.isArray(parsedResponse.creatorCategories)) {
        normalizedResponse.creatorCategories = parsedResponse.creatorCategories
          .filter(category => category && typeof category === 'object')
          .map(category => ({
            categoryName: category.categoryName || 'Recommended Creators',
            creators: Array.isArray(category.creators) ? category.creators
              .filter(creator => creator && typeof creator === 'object')
          .map(creator => ({
            name: creator.name || 'Unknown Creator',
            description: creator.description || 'No description provided',
                channelUrl: creator.channelUrl || 'https://youtube.com',
                subscribers: creator.subscribers || '500K subscribers',
                averageViews: creator.averageViews || '150K',
                budgetFit: creator.budgetFit || 'Medium fit'
              })) : []
          }))
          .filter(category => category.creators.length > 0);
      }
      
      // If the new format wasn't found but old format exists, convert it
      if (normalizedResponse.creatorCategories.length === 0 && 
          parsedResponse.recommendedCreators && 
          Array.isArray(parsedResponse.recommendedCreators) && 
          parsedResponse.recommendedCreators.length > 0) {
        
        console.log('Converting old creator format to categories');
        
        normalizedResponse.creatorCategories = [{
          categoryName: 'Recommended Creators',
          creators: parsedResponse.recommendedCreators
            .filter(creator => creator && typeof creator === 'object')
            .map(creator => ({
              name: creator.name || 'Unknown Creator',
              description: creator.description || 'No description provided',
              channelUrl: creator.channelUrl || 'https://youtube.com',
              subscribers: creator.subscribers || '500K subscribers',
              averageViews: creator.averageViews || '150K',
              budgetFit: 'Medium fit'
            }))
        }];
      }
      
      // Log what we got after normalization
      let totalCreators = 0;
      normalizedResponse.creatorCategories.forEach(category => {
        totalCreators += category.creators.length;
      });
      
      console.log('Creator categories after normalization:', 
        normalizedResponse.creatorCategories.map(category => ({
          category: category.categoryName,
          creatorCount: category.creators.length
        }))
      );
      
      console.log('Normalized response structure:', {
        campaignName: normalizedResponse.campaignName,
        videoIdeasCount: normalizedResponse.videoIdeas.length,
        trackingMetricsCount: normalizedResponse.trackingMetrics.length,
        keysToSuccessCount: normalizedResponse.keysToSuccess.length,
        categoryCount: normalizedResponse.creatorCategories.length,
        totalCreators: totalCreators
      });
      
      return normalizedResponse;
    }
  
    /**
     * Extract structured data from text when JSON parsing fails
     * @param {string} text - The AI response text
     * @returns {Object} - Structured campaign data
     */
    extractStructuredData(text) {
      console.log('Extracting structured data from text response');
      
      // Default structure matching what ResponseSection expects
      const result = {
        videoIdeas: [],
        trackingMetrics: [],
        keysToSuccess: [],
        creatorCategories: []
      };
      
      // Extract video ideas - try multiple patterns
      const videoIdeasPatterns = [
        /video ideas?:?([\s\S]*?)(tracking|measurement|metrics|keys|success|creators|$)/i,
        /content recommendations?:?([\s\S]*?)(tracking|measurement|metrics|keys|success|creators|$)/i
      ];
      
      for (const pattern of videoIdeasPatterns) {
        const videoMatch = text.match(pattern);
        if (videoMatch && videoMatch[1]) {
          result.videoIdeas = this.extractListItems(videoMatch[1], 5);
          if (result.videoIdeas.length > 0) break;
        }
      }
      
      // Extract tracking metrics
      const metricsPatterns = [
        /tracking metrics:?([\s\S]*?)(keys|success|creators|$)/i,
        /measurement metrics:?([\s\S]*?)(keys|success|creators|$)/i,
        /metrics:?([\s\S]*?)(keys|success|creators|$)/i
      ];
      
      for (const pattern of metricsPatterns) {
        const metricsMatch = text.match(pattern);
        if (metricsMatch && metricsMatch[1]) {
          result.trackingMetrics = this.extractListItems(metricsMatch[1], 5);
          if (result.trackingMetrics.length > 0) break;
        }
      }
      
      // Extract keys to success
      const keysPatterns = [
        /keys to success:?([\s\S]*?)(recommended|creators|$)/i,
        /key recommendations:?([\s\S]*?)(recommended|creators|$)/i,
        /tips for success:?([\s\S]*?)(recommended|creators|$)/i
      ];
      
      for (const pattern of keysPatterns) {
        const keysMatch = text.match(pattern);
        if (keysMatch && keysMatch[1]) {
          result.keysToSuccess = this.extractListItems(keysMatch[1], 5);
          if (result.keysToSuccess.length > 0) break;
        }
      }
      
      // Extract campaign name if present
      const campaignNameMatch = text.match(/campaign name:?\s*([^\n]+)/i);
      if (campaignNameMatch && campaignNameMatch[1]) {
        result.campaignName = campaignNameMatch[1].trim();
      } else {
        result.campaignName = 'YouTube Creator Campaign';
      }
      
      // Extract creator categories
      result.creatorCategories = this.extractCreatorCategories(text);
      
      // If no creator categories were found using the structured approach,
      // fall back to the old method for backward compatibility
      if (result.creatorCategories.length === 0) {
        const creators = this.extractCreators(text);
        if (creators.length > 0) {
          result.creatorCategories = [{
            categoryName: 'Recommended Creators',
            creators: creators
          }];
        }
      }
      
      // Log summary
      console.log('Extracted structured data:', {
        campaignName: result.campaignName,
        videoIdeasCount: result.videoIdeas.length,
        trackingMetricsCount: result.trackingMetrics.length,
        keysToSuccessCount: result.keysToSuccess.length,
        creatorCategoriesCount: result.creatorCategories.length,
        totalCreators: result.creatorCategories.reduce((acc, cat) => acc + cat.creators.length, 0)
      });
      
      return result;
    }
    
    /**
     * Extract list items from text
     * @param {string} text - Text containing list items
     * @param {number} maxItems - Maximum number of items to extract
     * @returns {Array} - Array of list items
     */
    extractListItems(text, maxItems = 5) {
      // Clean the text
      let cleanedText = text.trim();
      
      // Try to extract list items using various markers
      const listPatterns = [
        /(?:^|\n)(?:\d+\.|\-|\*|\•)\s*([^\n]+)/g,  // Numbered lists, bullet points
        /(?:^|\n)([^:.\n]{10,150})/g              // Lines with appropriate length
      ];
      
      let items = [];
      
      // Try each pattern until we find list items
      for (const pattern of listPatterns) {
        let matches;
        const patternItems = [];
        
        while ((matches = pattern.exec(cleanedText)) !== null) {
          const item = matches[1].trim();
          if (item && item.length > 5 && !patternItems.includes(item)) {
            patternItems.push(item);
          }
        }
        
        if (patternItems.length > 0) {
          items = patternItems;
          break;
        }
      }
      
      // If we didn't find anything, split by newlines as a last resort
      if (items.length === 0) {
        items = cleanedText.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 10 && line.length < 150)
          .filter(line => !line.endsWith(':'));
      }
      
      // Filter out duplicates and non-meaningful items
      items = items
        .filter((item, index, self) => 
          item.length > 5 && 
          self.indexOf(item) === index &&
          !/^\d+$/.test(item) &&
          !item.endsWith(':')
        )
        .map(item => 
          item
            .replace(/^\s*\d+\.\s*/, '')
            .replace(/^\s*[-*•]\s*/, '')
            .trim()
        )
        .slice(0, maxItems);
        
      return items;
    }
    
    /**
     * Extract creators from text
     * @param {string} text - Text response from AI
     * @returns {Array} - Array of creator objects
     */
    extractCreators(text) {
      return this.extractCreatorsFromText(text);
    }
  
    /**
     * Extract creators from the text response
     * @param {string} text - The AI response text
     * @returns {Array} - Array of creator objects
     */
    extractCreatorsFromText(text) {
      console.log('Extracting creators from text');
      const creators = [];
      
      // Look for sections with creator information
      const creatorSection = text.match(/recommended(?:\s+youtube)?\s+creators:?([\s\S]*?)(?:campaign\s+name|video\s+ideas|tracking\s+metrics|keys\s+to\s+success|$)/i);
      
      if (creatorSection && creatorSection[1]) {
        const creatorText = creatorSection[1];
        
        // Look for numbered or bullet point patterns
        const creatorItems = creatorText.match(/(?:^|\n)(?:\d+\.|\-|\*|\•)\s*([^\n]+(?:\n(?!\d+\.|\-|\*|\•)[^\n]+)*)/g);
        
        if (creatorItems && creatorItems.length > 0) {
          for (const item of creatorItems) {
            const cleanItem = item.replace(/^(?:\d+\.|\-|\*|\•)\s*/, '').trim();
            const nameParts = cleanItem.match(/^([^:,.(]+)[:,(]/);
            
            if (nameParts && nameParts[1]) {
              const name = nameParts[1].trim();
              const description = cleanItem.substring(nameParts[0].length).trim().replace(/^[:\s,-]+/, '');
              const subscribers = this.getSubscriberCount();
              const averageViews = this.getAverageViews(subscribers);
              
              creators.push({
                name,
                description: description || `${name} creates content that aligns well with your campaign goals.`,
                channelUrl: `https://youtube.com/c/${name.toLowerCase().replace(/\s+/g, '')}`,
                subscribers,
                averageViews
              });
            }
          }
        }
      }
      
      console.log(`Extracted ${creators.length} creators from text response`);
      return creators;
    }
  
    /**
     * Generate a mock campaign name based on the campaign data
     * @param {Object} data - The campaign data
     * @returns {string} - A campaign name
     */
    generateMockCampaignName(data) {
      const nameOptions = [
        `YouTube ${data.productAnalysis?.extractedInfo?.category || 'Product'} Boost`,
        `Creator ${data.productAnalysis?.extractedInfo?.category || 'Product'} Alliance`,
        `${data.productAnalysis?.extractedInfo?.category || 'YouTube'} Creator Impact`,
        `${data.productAnalysis?.extractedInfo?.category || 'YouTube'} Influencer Showcase`,
        `Amplify ${data.productAnalysis?.extractedInfo?.category || 'Your Product'}`
      ];
      
      // Add budget-specific names
      if (data.campaignBudget) {
        if (data.campaignBudget.includes('$1,000 - $5,000')) {
          nameOptions.push(`Micro-Influencer ${data.productAnalysis?.extractedInfo?.category || 'Product'} Push`);
          nameOptions.push(`Smart ${data.productAnalysis?.extractedInfo?.category || 'Product'} Showcase`);
        } else if (data.campaignBudget.includes('$5,000 - $10,000') || data.campaignBudget.includes('$10,000 - $25,000')) {
          nameOptions.push(`Mid-Tier ${data.productAnalysis?.extractedInfo?.category || 'Product'} Momentum`);
          nameOptions.push(`${data.productAnalysis?.extractedInfo?.category || 'Product'} Creator Collective`);
        } else if (data.campaignBudget.includes('$25,000') || data.campaignBudget.includes('$50,000')) {
          nameOptions.push(`Premium ${data.productAnalysis?.extractedInfo?.category || 'Product'} Creator Partnership`);
          nameOptions.push(`${data.productAnalysis?.extractedInfo?.category || 'Product'} Influencer Summit`);
        }
      }
      
      // Add goal-specific names
      const goals = data.campaignGoals?.toLowerCase() || '';
      if (goals.includes('brand awareness') || goals.includes('visibility')) {
        nameOptions.push(`${data.productAnalysis?.extractedInfo?.category || 'Brand'} Awareness Accelerator`);
      }
      if (goals.includes('sales') || goals.includes('conversion')) {
        nameOptions.push(`${data.productAnalysis?.extractedInfo?.category || 'Product'} Sales Drive`);
      }
      if (goals.includes('engagement') || goals.includes('community')) {
        nameOptions.push(`${data.productAnalysis?.extractedInfo?.category || 'Community'} Engagement Initiative`);
      }
      if (goals.includes('product launch') || goals.includes('new product')) {
        nameOptions.push(`${data.productAnalysis?.extractedInfo?.category || 'Product'} Launch Spotlight`);
      }
      
      // Shuffle and take first
      const shuffled = [...nameOptions].sort(() => 0.5 - Math.random());
      return shuffled[0];
    }
    
    /**
     * Generate mock video ideas based on the campaign data
     * @param {Object} data - The campaign data
     * @returns {Array} - List of video ideas
     */
    generateMockVideoIdeas(data) {
      const baseIdeas = [
        "Unboxing and first impressions video",
        "Detailed product review with pros and cons",
        "Comparison with similar products on the market",
        "Tutorial/How-to video showing product features",
        "Day-in-the-life featuring the product",
        "Problem solution video featuring the product",
        "Creative challenge using the product",
        "Before and after transformation with the product"
      ];
      
      const productSpecificIdeas = [];
      
      // Add ideas based on product category if available
      if (data.productAnalysis?.extractedInfo?.category) {
        const category = data.productAnalysis.extractedInfo.category.toLowerCase();
        
        if (category.includes('tech') || category.includes('electronics')) {
          productSpecificIdeas.push(
            "Tech teardown/inside look at how it works",
            "Week-long tech integration challenge",
            "Setup and optimization guide",
            "Tech product hacks and tips"
          );
        } else if (category.includes('beauty') || category.includes('cosmetic')) {
          productSpecificIdeas.push(
            "Get ready with me featuring the product",
            "Multi-look tutorial using the product",
            "Testing the product in different environments",
            "One product, multiple ways to use it"
          );
        } else if (category.includes('food') || category.includes('cooking')) {
          productSpecificIdeas.push(
            "Recipe development showcase",
            "Blind taste test with similar products",
            "Chef vs. Amateur using the product",
            "Meal prep efficiency challenge"
          );
        } else if (category.includes('fitness') || category.includes('health')) {
          productSpecificIdeas.push(
            "30-day transformation challenge",
            "Workout integration series",
            "Expert analysis of fitness benefits",
            "Beginner to advanced progression guide"
          );
        }
      }
      
      // Add ideas based on campaign goals
      const goals = data.campaignGoals?.toLowerCase() || '';
      if (goals.includes('brand awareness') || goals.includes('visibility')) {
        productSpecificIdeas.push(
          "Brand story and behind-the-scenes look",
          "Creator's honest first reaction to the brand",
          "Brand values and mission highlight reel"
        );
      }
      if (goals.includes('sales') || goals.includes('conversion')) {
        productSpecificIdeas.push(
          "Is it worth it? Value analysis video",
          "Problem-solution demo with clear benefits",
          "Limited-time offer announcement with demo"
        );
      }
      if (goals.includes('engagement') || goals.includes('community')) {
        productSpecificIdeas.push(
          "Community Q&A addressing product questions",
          "Interactive challenge with viewer participation",
          "Fan testimonials and reactions compilation"
        );
      }
      if (goals.includes('product launch') || goals.includes('new product')) {
        productSpecificIdeas.push(
          "Exclusive early access preview",
          "Launch day live unboxing and review",
          "First-to-market comparison with alternatives"
        );
      }
      
      // Add ideas based on timeline
      if (data.timeline?.includes('1-2 weeks')) {
        productSpecificIdeas.push(
          "Quick turnaround unboxing and first impressions",
          "48-hour challenge with the product",
          "Weekend product integration vlog"
        );
      } else if (data.timeline?.includes('2-3 months') || data.timeline?.includes('3-6 months')) {
        productSpecificIdeas.push(
          "Multi-part series tracking product performance over time",
          "Before, during, and after results video",
          "Monthly product update and advanced tips series"
        );
      }
      
      // Combine and shuffle ideas
      const allIdeas = [...baseIdeas, ...productSpecificIdeas];
      const shuffled = [...allIdeas].sort(() => 0.5 - Math.random());
      
      // Return 5-7 ideas
      return shuffled.slice(0, Math.floor(Math.random() * 3) + 5);
    }
    
    /**
     * Generate mock tracking metrics based on the campaign data
     * @param {Object} data - The campaign data
     * @returns {Array} - List of tracking metrics
     */
    generateMockTrackingMetrics(data) {
      const baseMetrics = [
        "Total video views across all creators",
        "Average watch time per video",
        "Click-through rate to product page",
        "Engagement rate (likes, comments, shares)",
        "Subscriber growth during campaign period",
        "Social media mentions and hashtag usage",
        "Conversion rate from video viewers to customers",
        "Brand sentiment analysis pre and post campaign"
      ];
      
      const goalSpecificMetrics = [];
      
      // Add metrics based on campaign goals
      const goals = data.campaignGoals?.toLowerCase() || '';
      if (goals.includes('brand awareness') || goals.includes('visibility')) {
        goalSpecificMetrics.push(
          "Brand recall increase post-campaign (survey)",
          "New audience demographic reach statistics",
          "Share of voice compared to competitors",
          "Search volume increase for brand terms"
        );
      }
      if (goals.includes('sales') || goals.includes('conversion')) {
        goalSpecificMetrics.push(
          "Revenue attributed to creator content",
          "Conversion rate by creator and content type",
          "Average order value from campaign traffic",
          "Return on ad spend (ROAS) per creator"
        );
      }
      if (goals.includes('engagement') || goals.includes('community')) {
        goalSpecificMetrics.push(
          "Comment sentiment analysis by topic",
          "User-generated content volume inspired by campaign",
          "Community growth rate across platforms",
          "Returning vs. new audience engagement metrics"
        );
      }
      if (goals.includes('product launch') || goals.includes('new product')) {
        goalSpecificMetrics.push(
          "Product awareness metrics pre and post launch",
          "Time to first purchase after viewing content",
          "Preorder/waitlist sign-ups from campaign",
          "Market share capture within first 30/60/90 days"
        );
      }
      
      // Combine and shuffle metrics
      const allMetrics = [...baseMetrics, ...goalSpecificMetrics];
      const shuffled = [...allMetrics].sort(() => 0.5 - Math.random());
      
      // Return 5-6 metrics
      return shuffled.slice(0, Math.floor(Math.random() * 2) + 5);
    }
    
    /**
     * Generate mock keys to success based on the campaign data
     * @param {Object} data - The campaign data
     * @returns {Array} - List of keys to success
     */
    generateMockKeysToSuccess(data) {
      const baseKeys = [
        "Clear communication of campaign expectations with creators",
        "Providing comprehensive product information and unique selling points",
        "Setting up tracking links and discount codes for each creator",
        "Regular check-ins with creators during content creation process",
        "Timely reviews of content drafts before publication",
        "Engaging with comments on creator videos",
        "Repurposing creator content across other marketing channels",
        "Scheduling content releases for maximum impact"
      ];
      
      const specificKeys = [];
      
      // Add keys based on budget
      if (data.campaignBudget?.includes('$1,000 - $5,000')) {
        specificKeys.push(
          "Focusing on micro-influencers with highly engaged audiences for better ROI",
          "Balancing creator quantity vs. quality within limited budget",
          "Leveraging user-generated content to extend campaign reach"
        );
      } else if (data.campaignBudget?.includes('$25,000') || data.campaignBudget?.includes('$50,000')) {
        specificKeys.push(
          "Creating exclusive content with premium creators",
          "Developing multi-platform content strategy with top creators",
          "Investing in production quality to enhance campaign perception"
        );
      }
      
      // Add keys based on timeline
      if (data.timeline?.includes('1-2 weeks')) {
        specificKeys.push(
          "Streamlined content approval process for quick turnaround",
          "Preparing assets and briefs in advance for immediate start",
          "Focusing on high-impact, easily produced content formats"
        );
      } else if (data.timeline?.includes('3-6 months') || data.timeline?.includes('6+')) {
        specificKeys.push(
          "Developing a phased content calendar with evolving messaging",
          "Planning seasonal content variations throughout campaign",
          "Setting up mid-campaign performance reviews and optimization"
        );
      }
      
      // Add keys based on campaign goals
      const goals = data.campaignGoals?.toLowerCase() || '';
      if (goals.includes('brand awareness') || goals.includes('visibility')) {
        specificKeys.push(
          "Selecting creators who align with brand values and aesthetics",
          "Focusing on storytelling that highlights brand differentiation"
        );
      }
      if (goals.includes('sales') || goals.includes('conversion')) {
        specificKeys.push(
          "Including clear calls-to-action in creator briefs",
          "Optimizing landing pages for campaign traffic conversion"
        );
      }
      
      // Combine and shuffle keys
      const allKeys = [...baseKeys, ...specificKeys];
      const shuffled = [...allKeys].sort(() => 0.5 - Math.random());
      
      // Return 5-6 keys
      return shuffled.slice(0, Math.floor(Math.random() * 2) + 5);
    }
    
    /**
     * Generate a mock response structure for testing without API
     * @param {Object} campaignData - The input campaign data
     * @returns {Object} - Mock campaign response
     */
    generateMockResponse(campaignData) {
      try {
        // Log that we're using mock data
        console.log('Generating mock campaign response');
        
        // Generate creator categories with multiple creators in each
        const creatorCategories = this.generateMockCreatorCategoriesWithMoreCreators(campaignData);
        
        // Return structured mock response
        return {
          campaignName: this.generateMockCampaignName(campaignData),
          videoIdeas: this.generateMockVideoIdeas(campaignData),
          trackingMetrics: this.generateMockTrackingMetrics(campaignData),
          keysToSuccess: this.generateMockKeysToSuccess(campaignData),
          creatorCategories: creatorCategories
        };
      } catch (error) {
        console.error('Error generating mock response:', error);
        
        // Return fallback response
        return {
          campaignName: 'YouTube Creator Campaign Plan',
          videoIdeas: [
            'Product review video',
            'Unboxing experience',
            'How-to tutorial',
            'Comparison with competitors',
            'Creative use cases'
          ],
          trackingMetrics: [
            'Total video views',
            'Click-through rate',
            'Engagement metrics',
            'Conversion rate',
            'ROI per creator'
          ],
          keysToSuccess: [
            'Clear creator guidelines and expectations',
            'Providing quality product information',
            'Timely communication with creators',
            'Tracking performance metrics',
            'Engaging with audience comments'
          ],
          creatorCategories: creatorCategories || []
        };
      }
    }
    
    /**
     * Generate mock creator categories with multiple creators per category
     * @param {Object} campaignData - Campaign form data
     * @returns {Array} - Array of category objects with creators
     */
    generateMockCreatorCategoriesWithMoreCreators(campaignData) {
      const categories = [
        'Beauty & Lifestyle', 'Tech Reviewers', 'Fitness Enthusiasts', 
        'Gaming Channels', 'Food & Cooking', 'DIY & Crafts', 
        'Travel Vloggers', 'Educational Content', 'Fashion Influencers'
      ];
      
      // Shuffle and pick 3-4 categories based on campaign data
      const shuffled = [...categories].sort(() => 0.5 - Math.random());
      const numCategories = 3 + Math.floor(Math.random() * 2); // 3 or 4 categories
      const selectedCategories = shuffled.slice(0, numCategories);
      
      // Parse budget range to determine appropriate creator sizes
      const budget = campaignData.campaignBudget || '$5,000 - $10,000';
      const budgetRange = this.parseBudgetRange(budget);
      
      return selectedCategories.map(categoryName => {
        // Generate 5-8 creators per category
        const numCreators = 5 + Math.floor(Math.random() * 4);
        
        return {
          categoryName,
          creators: Array.from({ length: numCreators }, (_, i) => {
            const subscriberCount = this.getSubscriberCount(budgetRange);
            const averageViews = this.getAverageViews(subscriberCount);
            const budgetFit = this.getBudgetFit(subscriberCount, budget);
            
            return {
              name: this.getCreatorName(categoryName, i),
              description: this.getCreatorDescription(categoryName),
              channelUrl: `https://youtube.com/c/${this.getCreatorName(categoryName, i).replace(/\s+/g, '').toLowerCase()}`,
              subscribers: subscriberCount,
              averageViews: averageViews,
              budgetFit: budgetFit
            };
          })
        };
      });
    }
    
    /**
     * Parse budget range from budget string
     * @param {string} budgetStr - Budget string (e.g. "$5,000-$10,000")
     * @returns {Object} - Object with min and max budget values
     */
    parseBudgetRange(budgetStr) {
      if (!budgetStr) return { min: 10000, max: 20000 }; // Default range
      
      // Extract numbers from string using regex
      const numbers = budgetStr.match(/\$?([\d,]+)/g) || [];
      let min = 10000;
      let max = 20000;
      
      if (numbers.length >= 1) {
        // Remove $ and commas, then parse
        min = parseInt(numbers[0].replace(/[$,]/g, ''));
      }
      
      if (numbers.length >= 2) {
        // Remove $ and commas, then parse
        max = parseInt(numbers[1].replace(/[$,]/g, ''));
      }
      
      // Handle case where only one number is provided
      if (numbers.length === 1) {
        if (budgetStr.includes('under') || budgetStr.includes('less than')) {
          max = min;
          min = 0;
        } else if (budgetStr.includes('over') || budgetStr.includes('more than')) {
          max = min * 2; // Estimate a reasonable max
        } else {
          // Single value, create a range around it
          max = min * 1.5;
          min = min * 0.5;
        }
      }
      
      return { min, max };
    }
    
    /**
     * Get appropriate subscriber counts based on budget
     * @param {Object} budgetRange - Budget range object
     * @returns {string} - Subscriber count string
     */
    getSubscriberCount(budgetRange) {
      let ranges = [];
      
      if (budgetRange.min < 5000) {
        // Small budget: micro-influencers
        ranges = ['50K subscribers', '80K subscribers', '120K subscribers', '180K subscribers'];
      } else if (budgetRange.min < 25000) {
        // Medium budget: mid-tier creators
        ranges = ['250K subscribers', '500K subscribers', '750K subscribers', '950K subscribers'];
      } else {
        // Large budget: larger creators
        ranges = ['1.2M subscribers', '1.5M subscribers', '2.5M subscribers', '3.5M subscribers'];
      }
      
      return ranges[Math.floor(Math.random() * ranges.length)];
    }
    
    /**
     * Get average views based on subscriber count
     * @param {string} subscribers - Subscriber count string
     * @returns {string} - Average views string
     */
    getAverageViews(subscribers) {
      // Extract number from subscriber string if possible
      let subCount = 0;
      if (typeof subscribers === 'string') {
        const match = subscribers.match(/(\d+(?:\.\d+)?)(K|M)?/);
        if (match) {
          const num = parseFloat(match[1]);
          const unit = match[2] || '';
          
          if (unit === 'K') {
            subCount = num * 1000;
          } else if (unit === 'M') {
            subCount = num * 1000000;
          } else {
            subCount = num;
          }
        }
      }
      
      // Default to 200K if parsing failed
      if (!subCount) subCount = 200000;
      
      // Calculate average views based on typical engagement rates
      // Usually 5-15% of subscribers watch a video
      const viewRate = 0.05 + (Math.random() * 0.1); // 5-15% view rate
      const avgViews = Math.round(subCount * viewRate);
      
      // Format the number with K or M
      if (avgViews >= 1000000) {
        return `${(avgViews / 1000000).toFixed(1)}M`;
      } else if (avgViews >= 1000) {
        return `${(avgViews / 1000).toFixed(0)}K`;
      } else {
        return avgViews.toString();
      }
    }
    
    /**
     * Determine budget fit based on subscriber count and budget
     * @param {string} subscribers - Subscriber count string
     * @param {string} budget - Budget range
     * @returns {string} - Budget fit description
     */
    getBudgetFit(subscribers, budget) {
      const budgetValue = parseFloat(budget.replace(/[^0-9.]/g, ''));
      const subscriberText = subscribers.replace(' subscribers', '');
      const subscriberNum = parseInt(subscriberText.replace(/[^0-9]/g, ''));
      const isMillion = subscriberText.includes('M');
      
      // Low budget (<$5000): Good fit for 50-180K subs
      if (budgetValue < 5000) {
        if ((isMillion) || subscriberNum > 200) {
          return 'Low fit for your budget';
        } else {
          return 'High fit for your budget';
        }
      }
      // Medium budget ($5000-$25000): Good fit for 200K-1M subs 
      else if (budgetValue < 25000) {
        if (isMillion && subscriberNum > 1) {
          return 'Low fit for your budget';
        } else if (!isMillion && subscriberNum < 200) {
          return 'Low fit for your budget';
        } else {
          return 'High fit for your budget';
        }
      }
      // High budget (>$25000): Good fit for >1M subs
      else {
        if (isMillion && subscriberNum >= 1) {
          return 'High fit for your budget';
        } else {
          return 'Low fit for your budget';
        }
      }
    }
    
    /**
     * Generate a creator name based on category
     * @param {string} category - Category name
     * @param {number} index - Creator index for variety
     * @returns {string} - Creator name
     */
    getCreatorName(category, index) {
      const prefixes = ['The', 'Amazing', 'Pro', 'Ultimate', 'Top', ''];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      
      // Extract main category word
      const categoryWords = category.split(/\s+/);
      const mainWord = categoryWords[0];
      
      // Random names based on category
      const namesByCategory = {
        'Beauty': ['BeautyGuru', 'GlamLife', 'MakeupPro', 'BeautyInsider', 'StyleQueen'],
        'Tech': ['TechGeek', 'GadgetGuru', 'TechReviewer', 'DigitalInsider', 'TechExplorer'],
        'Fitness': ['FitnessPro', 'WorkoutBeast', 'FitnessJourney', 'ActiveLife', 'FitCoach'],
        'Gaming': ['GameMaster', 'ProGamer', 'GamersDelight', 'PlayStation', 'GamerLife'],
        'Food': ['ChefMaster', 'CookingPro', 'FoodieAdventures', 'TastyTreats', 'CulinaryJoy'],
        'DIY': ['CraftyCreator', 'DIYMaster', 'HandmadePro', 'CraftExplorer', 'MakerSpace'],
        'Travel': ['WanderlustLife', 'TravelPro', 'GlobalExplorer', 'AdventureSeeker', 'TravelJunkie'],
        'Educational': ['KnowledgeGuru', 'LearnWithMe', 'EduExplorer', 'ThinkTank', 'MindMaster'],
        'Fashion': ['StyleIcon', 'FashionForward', 'TrendSetter', 'ChicStyle', 'FashionPro']
      };
      
      // Find the right category for naming
      const categoryKey = Object.keys(namesByCategory).find(key => 
        category.includes(key)
      ) || Object.keys(namesByCategory)[index % Object.keys(namesByCategory).length];
      
      // Get names for that category
      const names = namesByCategory[categoryKey];
      const name = names[index % names.length];
      
      // Add a number sometimes
      const addNumber = Math.random() > 0.7;
      const number = addNumber ? Math.floor(Math.random() * 1000) : '';
      
      return prefix ? `${prefix} ${name}${number}` : `${name}${number}`;
    }
    
    /**
     * Generate a creator description based on category
     * @param {string} category - Category name
     * @returns {string} - Creator description
     */
    getCreatorDescription(category) {
      const descriptions = {
        'Beauty': 'Creates engaging beauty content with product reviews, tutorials and trends. Known for authentic opinions and high production quality.',
        'Tech': 'Detailed tech reviews and analysis with a focus on user experience. Provides in-depth comparisons and helpful buying advice.',
        'Fitness': 'Motivational workout content and fitness advice for all levels. Specializes in accessible routines and healthy lifestyle tips.',
        'Gaming': 'Entertaining gameplay videos with expert commentary. Features new releases, tips, tricks, and gaming industry insights.',
        'Food': 'Mouth-watering food content with easy-to-follow recipes. Known for creative dishes and engaging presentation style.',
        'DIY': 'Step-by-step DIY projects and craft tutorials. Inspires viewers with creative ideas and detailed instructions.',
        'Travel': 'Immersive travel vlogs showcasing destinations worldwide. Offers practical travel tips and cultural insights.',
        'Educational': 'Engaging educational content that simplifies complex topics. Makes learning accessible and entertaining.',
        'Fashion': 'Trendy fashion content with styling tips and outfit ideas. Keeps viewers updated on the latest fashion trends.'
      };
      
      // Find the right category for description
      const categoryKey = Object.keys(descriptions).find(key => 
        category.includes(key)
      ) || 'Beauty';
      
      return descriptions[categoryKey];
    }
    
    /**
     * Extract creator categories from text response
     * Similar to extractCreators but handles category structure
     * @param {string} text - The text response
     * @returns {Array} - Array of category objects with creators
     */
    extractCreatorCategories(text) {
      console.log('Extracting creator categories from text response');
      const categories = [];
      let currentCategory = null;
      
      // First check if we can find category sections
      const categoryPattern = /\b(Category|Niche|Group):\s*([^:]+?)(?=\n\s*\n|\n\s*(?:Category|Niche|Group):|$)/gs;
      let categoryMatches = Array.from(text.matchAll(categoryPattern));
      
      // If we found explicit categories, parse them
      if (categoryMatches.length > 0) {
        console.log(`Found ${categoryMatches.length} explicit creator categories`);
        
        for (const match of categoryMatches) {
          const categoryText = match[0];
          const categoryName = match[2].trim();
          
          // Extract creators for this category
          const creators = this.extractCreatorsFromText(categoryText);
          
          if (creators.length > 0) {
            categories.push({
              categoryName,
              creators
            });
          }
        }
      } 
      // If no categories found, try to group creators logically
      else {
        console.log('No explicit categories found, grouping creators based on content type');
        const allCreators = this.extractCreatorsFromText(text);
        
        if (allCreators.length > 0) {
          // Attempt to categorize based on descriptions or names
          const categorized = this.categorizeCreatorsByType(allCreators);
          categories.push(...categorized);
        }
      }
      
      console.log(`Extracted ${categories.length} categories with ${categories.reduce((acc, cat) => acc + cat.creators.length, 0)} total creators`);
      return categories;
    }
    
    /**
     * Group creators into categories based on their content/names
     * @param {Array} creators - List of creator objects
     * @returns {Array} - Array of category objects
     */
    categorizeCreatorsByType(creators) {
      const categories = [];
      const typeKeywords = {
        'Review': ['review', 'unbox', 'test', 'critic'],
        'Lifestyle': ['lifestyle', 'daily', 'vlog', 'life'],
        'Tutorial': ['tutorial', 'how to', 'guide', 'tips', 'learn'],
        'Entertainment': ['entertainment', 'funny', 'comedy', 'prank'],
        'Niche': [] // Default category
      };
      
      // Create categories for each type
      const creatorsByType = {};
      
      // Assign creators to categories based on name and description
      for (const creator of creators) {
        let assigned = false;
        const textToCheck = (creator.name + ' ' + creator.description).toLowerCase();
        
        for (const [type, keywords] of Object.entries(typeKeywords)) {
          if (type === 'Niche') continue; // Skip default category during first pass
          
          for (const keyword of keywords) {
            if (textToCheck.includes(keyword)) {
              creatorsByType[type] = creatorsByType[type] || [];
              creatorsByType[type].push(creator);
              assigned = true;
              break;
            }
          }
          if (assigned) break;
        }
        
        // If not assigned to any category, put in Niche
        if (!assigned) {
          creatorsByType['Niche'] = creatorsByType['Niche'] || [];
          creatorsByType['Niche'].push(creator);
        }
      }
      
      // Create category objects
      for (const [type, typeCreators] of Object.entries(creatorsByType)) {
        if (typeCreators.length > 0) {
          categories.push({
            categoryName: `${type} Creators`,
            creators: typeCreators
          });
        }
      }
      
      return categories;
    }

    /**
     * Generate timeline-specific marketing recommendations
     * @param {string} timeline - User selected timeline
     * @param {Object} campaignData - Full campaign data for context
     * @returns {Promise<Object>} - Timeline-specific recommendations
     */
    async generateTimelineRecommendations(timeline, campaignData) {
      try {
        // Ensure the service is ready
        if (!await this.isReady()) {
          throw new Error('Service not initialized');
        }
        
        if (this.useMock) {
          console.log('Using mock timeline recommendations generator');
          return this.generateMockTimelineRecommendations(timeline, campaignData);
        }
        
        console.log('Generating timeline-specific recommendations for:', timeline);
        
        // Create specialized prompt for timeline recommendations
        const prompt = this.createTimelinePrompt(timeline, campaignData);
        
        try {
          // Generate content with the model
          const result = await this.model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.2,
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 2048,
              responseMimeType: "application/json"
            }
          });
          
          // Check for error response
          if (!result || !result.response) {
            throw new Error('Empty response received from Gemini API');
          }
          
          const response = result.response;
          const text = response.text();
          
          // Parse the text response into structured data
          return this.parseTimelineResponse(text);
        } catch (error) {
          console.error('Error generating timeline recommendations:', error);
          // Fallback to mock implementation
          return this.generateMockTimelineRecommendations(timeline, campaignData);
        }
      } catch (error) {
        console.error('Error in generateTimelineRecommendations:', error);
        return this.generateMockTimelineRecommendations(timeline, campaignData);
      }
    }
    
    /**
     * Create a specialized prompt for timeline recommendations
     * @param {string} timeline - Selected timeline
     * @param {Object} campaignData - Campaign data for context
     * @returns {string} - Formatted prompt
     */
    createTimelinePrompt(timeline, campaignData) {
      // Extract relevant campaign info
      const budget = campaignData.campaignBudget || 'Unknown';
      const goals = campaignData.campaignGoals || 'Not specified';
      const productType = campaignData.productAnalysis?.extractedInfo?.category || 'product';
      
      return `I need a detailed marketing campaign plan specifically optimized for a ${timeline} timeline for a ${productType}. 
      
Campaign context:
- Timeline: ${timeline}
- Budget: ${budget}
- Goals: ${goals}
- Product type: ${productType}

Please provide:
1. A week-by-week or phase-by-phase campaign timeline showing key activities and milestones
2. Specific creator collaboration strategies optimized for this ${timeline} timeframe
3. Content production and publication recommendations suited for this duration
4. Recommendations for how to structure creator contracts and deliverables given this timeline
5. Suggested communication cadence with creators for this timeline
6. Key performance indicators to track at different stages of the timeline

Format your response as valid JSON with the following structure exactly:
{
  "timelinePlan": {
    "title": "Campaign plan title for ${timeline}",
    "overview": "Brief overview of the campaign approach for this timeline",
    "phases": [
      {
        "name": "Phase 1 name",
        "duration": "Duration of this phase",
        "description": "Description of this phase",
        "activities": ["Activity 1", "Activity 2"]
      }
    ]
  },
  "creatorCollaboration": {
    "strategy": "Overall collaboration strategy",
    "contractRecommendations": ["Contract recommendation 1", "Contract recommendation 2"],
    "communicationCadence": "Recommended communication schedule",
    "contentRecommendations": ["Content recommendation 1", "Content recommendation 2"]
  },
  "timelineSpecificTips": ["Tip 1", "Tip 2", "Tip 3"],
  "keyPerformanceIndicators": ["KPI 1", "KPI 2", "KPI 3"]
}

Provide practical, actionable advice tailored to this specific timeline.`;
    }
    
    /**
     * Parse the timeline recommendation response
     * @param {string} text - Response text from Gemini
     * @returns {Object} - Structured timeline recommendations
     */
    parseTimelineResponse(text) {
      try {
        // Try to parse as JSON first
        console.log('Attempting to parse timeline response as JSON');
        
        // Try to extract just the JSON part
        const jsonMatch = text.match(/(\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[0]) {
          const cleanedText = jsonMatch[0];
          
          try {
            // Parse the cleaned text
            const parsedData = JSON.parse(cleanedText);
            console.log('Successfully parsed timeline response as JSON');
            return parsedData;
          } catch (jsonError) {
            console.error('Timeline JSON parsing failed:', jsonError.message);
          }
        }
        
        // If JSON parsing fails, create a structured object from text extraction
        return this.extractTimelineData(text);
      } catch (error) {
        console.error('Error parsing timeline response:', error);
        return this.generateMockTimelineRecommendations("1 month", {});
      }
    }
    
    /**
     * Extract structured timeline data from text
     * @param {string} text - Response text
     * @returns {Object} - Structured timeline data
     */
    extractTimelineData(text) {
      console.log('Extracting timeline data from text response');
      
      // Default structure
      const result = {
        timelinePlan: {
          title: "Campaign Plan",
          overview: "Campaign approach based on your timeline",
          phases: []
        },
        creatorCollaboration: {
          strategy: "Collaboration strategy based on your timeline",
          contractRecommendations: [],
          communicationCadence: "Regular check-ins throughout the campaign",
          contentRecommendations: []
        },
        timelineSpecificTips: [],
        keyPerformanceIndicators: []
      };
      
      // Extract the title if present
      const titleMatch = text.match(/title:?\s*([^\n]+)/i);
      if (titleMatch && titleMatch[1]) {
        result.timelinePlan.title = titleMatch[1].trim();
      }
      
      // Extract the overview if present
      const overviewMatch = text.match(/overview:?\s*([^\n]+(?:\n(?!phase|collaboration|tips|kpi)[^\n]+)*)/i);
      if (overviewMatch && overviewMatch[1]) {
        result.timelinePlan.overview = overviewMatch[1].trim();
      }
      
      // Extract phases
      const phasesSection = text.match(/phases?:?([\s\S]*?)(?:creator collaboration|strategy|tips|kpi|$)/i);
      if (phasesSection && phasesSection[1]) {
        const phaseMatches = phasesSection[1].match(/(?:^|\n)(?:phase|week|month)\s*\d+[:\s]([^\n]+(?:\n(?!phase|week|month\s+\d+)[^\n]+)*)/gi);
        
        if (phaseMatches) {
          phaseMatches.forEach((phaseText, index) => {
            const nameMatch = phaseText.match(/(?:phase|week|month)\s*\d+[:\s]([^\n]+)/i);
            const name = nameMatch ? nameMatch[1].trim() : `Phase ${index + 1}`;
            
            const durationMatch = phaseText.match(/duration:?\s*([^\n]+)/i);
            const duration = durationMatch ? durationMatch[1].trim() : `Week ${index + 1}`;
            
            const descMatch = phaseText.match(/description:?\s*([^\n]+(?:\n(?!activit|duration)[^\n]+)*)/i);
            const description = descMatch ? descMatch[1].trim() : "";
            
            const activitiesSection = phaseText.match(/activities:?([\s\S]*?)(?:duration|description|$)/i);
            const activities = activitiesSection ? 
              this.extractListItems(activitiesSection[1], 5) : 
              [];
            
            result.timelinePlan.phases.push({
              name,
              duration,
              description,
              activities
            });
          });
        }
      }
      
      // Extract collaboration strategy
      const strategyMatch = text.match(/collaboration strategy:?\s*([^\n]+(?:\n(?!contract|communication|content)[^\n]+)*)/i);
      if (strategyMatch && strategyMatch[1]) {
        result.creatorCollaboration.strategy = strategyMatch[1].trim();
      }
      
      // Extract contract recommendations
      const contractSection = text.match(/contract recommendations?:?([\s\S]*?)(?:communication|content|tips|kpi|$)/i);
      if (contractSection && contractSection[1]) {
        result.creatorCollaboration.contractRecommendations = this.extractListItems(contractSection[1], 4);
      }
      
      // Extract communication cadence
      const cadenceMatch = text.match(/communication cadence:?\s*([^\n]+(?:\n(?!content|tips|kpi)[^\n]+)*)/i);
      if (cadenceMatch && cadenceMatch[1]) {
        result.creatorCollaboration.communicationCadence = cadenceMatch[1].trim();
      }
      
      // Extract content recommendations
      const contentSection = text.match(/content recommendations?:?([\s\S]*?)(?:tips|kpi|$)/i);
      if (contentSection && contentSection[1]) {
        result.creatorCollaboration.contentRecommendations = this.extractListItems(contentSection[1], 4);
      }
      
      // Extract timeline specific tips
      const tipsSection = text.match(/timeline (?:specific )?tips:?([\s\S]*?)(?:key performance|kpi|$)/i);
      if (tipsSection && tipsSection[1]) {
        result.timelineSpecificTips = this.extractListItems(tipsSection[1], 5);
      }
      
      // Extract KPIs
      const kpiSection = text.match(/key performance indicators?:?([\s\S]*?)$/i);
      if (kpiSection && kpiSection[1]) {
        result.keyPerformanceIndicators = this.extractListItems(kpiSection[1], 5);
      }
      
      return result;
    }
    
    /**
     * Generate mock timeline recommendations for testing
     * @param {string} timeline - Selected timeline
     * @param {Object} campaignData - Campaign data for context
     * @returns {Object} - Mock timeline recommendations
     */
    generateMockTimelineRecommendations(timeline, campaignData) {
      const mockData = {
        timelinePlan: {
          title: "",
          overview: "",
          phases: []
        },
        creatorCollaboration: {
          strategy: "",
          contractRecommendations: [],
          communicationCadence: "",
          contentRecommendations: []
        },
        timelineSpecificTips: [],
        keyPerformanceIndicators: []
      };
      
      // Set timeline-specific data
      if (timeline.includes("1-2 weeks")) {
        mockData.timelinePlan.title = "Rapid Launch YouTube Campaign";
        mockData.timelinePlan.overview = "A focused, high-impact campaign designed for quick deployment and immediate results.";
        mockData.timelinePlan.phases = [
          {
            name: "Pre-Launch (Days 1-2)",
            duration: "2 days",
            description: "Rapid creator selection and briefing",
            activities: ["Finalize creator selection", "Send product samples via expedited shipping", "Conduct streamlined briefing calls"]
          },
          {
            name: "Content Creation (Days 3-7)",
            duration: "5 days",
            description: "Fast-turnaround content production",
            activities: ["Creators record unboxing/first impressions", "Quick review and approval cycle", "Prepare social media support assets"]
          },
          {
            name: "Publication & Promotion (Days 8-14)",
            duration: "7 days",
            description: "Coordinated content release and amplification",
            activities: ["Staggered content release across creators", "Immediate engagement with comments", "Cross-promotion across brand channels"]
          }
        ];
        
        mockData.creatorCollaboration.strategy = "Focus on nimble micro-influencers (50K-500K subscribers) known for quick turnaround content.";
        mockData.creatorCollaboration.contractRecommendations = [
          "Use simplified, one-page agreements with clear deliverables",
          "Offer premium rates for fast turnaround (20-30% above standard)",
          "Include 'rush delivery' terms with specific publishing dates",
          "Consider performance bonuses for exceptional engagement metrics"
        ];
        mockData.creatorCollaboration.communicationCadence = "Daily check-ins via text/messaging apps with a mid-campaign video call.";
        mockData.creatorCollaboration.contentRecommendations = [
          "Prioritize unboxings and first impressions content",
          "Focus on 5-10 minute videos highlighting key product features",
          "Request immediate Instagram/TikTok teasers before full video",
          "Emphasize authentic, immediate reactions rather than long-term testing"
        ];
        
        mockData.timelineSpecificTips = [
          "Pre-write and approve social copy for creators to use",
          "Prepare a 'quick-start guide' for creators to reference",
          "Have backup creators on standby in case of delays",
          "Create ready-to-use hashtags and captions for consistency",
          "Focus on immediate call-to-actions like limited-time offers"
        ];
        
        mockData.keyPerformanceIndicators = [
          "24-hour view velocity (views in first day of publication)",
          "Click-through rate to promotion landing page",
          "Comment sentiment within first 48 hours",
          "Share rate compared to creator's average",
          "Immediate conversion attribution"
        ];
      } 
      else if (timeline.includes("1 month")) {
        mockData.timelinePlan.title = "Balanced Impact YouTube Campaign";
        mockData.timelinePlan.overview = "A strategic campaign balancing speed and depth to build momentum over four weeks.";
        mockData.timelinePlan.phases = [
          {
            name: "Planning & Outreach (Week 1)",
            duration: "7 days",
            description: "Strategic creator selection and thorough briefing",
            activities: ["Identify and contact ideal creators", "Negotiate terms and deliverables", "Ship products and materials"]
          },
          {
            name: "Content Creation (Week 2)",
            duration: "7 days",
            description: "Coordinated content development",
            activities: ["Creators develop initial concepts", "Brand feedback and guidance", "Script/storyboard approval"]
          },
          {
            name: "Publication Strategy (Week 3)",
            duration: "7 days",
            description: "Staggered content release",
            activities: ["First wave of creator content goes live", "Active community management", "Optimization based on early performance"]
          },
          {
            name: "Amplification & Analysis (Week 4)",
            duration: "7 days",
            description: "Maximize impact of published content",
            activities: ["Second wave of creator content", "Amplify top-performing videos", "Compile performance report"]
          }
        ];
        
        mockData.creatorCollaboration.strategy = "Balance between micro and mid-tier creators (100K-1M subscribers) with a mix of quick and in-depth content.";
        mockData.creatorCollaboration.contractRecommendations = [
          "Standard creator agreements with clear deliverable schedule",
          "Include secondary deliverables (Instagram/TikTok cross-promotion)",
          "Two-phase payment structure (50% upfront, 50% upon publication)",
          "30-day exclusivity clause to prevent competitor promotion"
        ];
        mockData.creatorCollaboration.communicationCadence = "Weekly scheduled check-ins with email updates every 2-3 days during critical phases.";
        mockData.creatorCollaboration.contentRecommendations = [
          "Mix of unboxing, review, and how-to content",
          "Coordinate release dates for maximum impact",
          "Include product link and discount code in description",
          "Encourage multiple social platform support"
        ];
        
        mockData.timelineSpecificTips = [
          "Create a content calendar with publication windows",
          "Develop shareable graphics for creators to maintain brand consistency",
          "Schedule mid-campaign check-in calls to adjust strategy",
          "Prepare Q&A document for creators to reference",
          "Allocate budget for mid-campaign boosting of top performers"
        ];
        
        mockData.keyPerformanceIndicators = [
          "Week-over-week view growth rate",
          "Engagement rate versus creator baseline",
          "Traffic quality metrics (time on site from creator referrals)",
          "Conversion rate by creator/video type",
          "Audience retention metrics on long-form content"
        ];
      }
      else if (timeline.includes("2-3 months")) {
        mockData.timelinePlan.title = "Comprehensive Creator Campaign";
        mockData.timelinePlan.overview = "A thorough campaign leveraging multiple content types and creator relationships for sustained impact.";
        mockData.timelinePlan.phases = [
          {
            name: "Strategic Planning (Weeks 1-2)",
            duration: "2 weeks",
            description: "Thorough creator research and campaign framework",
            activities: ["Conduct creator landscape analysis", "Develop creative brief and messaging framework", "Finalize creator selection criteria"]
          },
          {
            name: "Creator Onboarding (Weeks 3-4)",
            duration: "2 weeks",
            description: "Building relationships and aligning expectations",
            activities: ["Contract negotiation and signing", "In-depth product education sessions", "Creative concept development with creators"]
          },
          {
            name: "Primary Content Creation (Weeks 5-7)",
            duration: "3 weeks",
            description: "Core content development and review cycle",
            activities: ["Creators develop initial content", "Feedback and optimization rounds", "Final approval and publication scheduling"]
          },
          {
            name: "Content Release Wave 1 (Weeks 8-9)",
            duration: "2 weeks",
            description: "Initial content publication and monitoring",
            activities: ["Coordinated content release schedule", "Active community engagement", "Performance tracking and optimization"]
          },
          {
            name: "Follow-up Content (Weeks 10-12)",
            duration: "3 weeks",
            description: "Response-based content and campaign expansion",
            activities: ["Develop follow-up content based on audience questions", "Address common themes from comments", "Create success story highlights"]
          }
        ];
        
        mockData.creatorCollaboration.strategy = "Develop deeper partnerships with select mid-tier creators (500K-2M subscribers) with proven engagement rates and relevant audience demographics.";
        mockData.creatorCollaboration.contractRecommendations = [
          "Comprehensive contracts with multi-content deliverables",
          "Tiered payment structure tied to content milestones",
          "Include options for campaign extension based on performance",
          "Add exclusivity clauses with appropriate compensation"
        ];
        mockData.creatorCollaboration.communicationCadence = "Weekly scheduled video calls with shared project management workspace for ongoing collaboration.";
        mockData.creatorCollaboration.contentRecommendations = [
          "Multi-part content series showing product benefits over time",
          "Mix of detailed reviews, tutorials, and real-life application videos",
          "Encourage authentic integration into creator's regular content style",
          "Plan for follow-up content addressing audience questions/feedback"
        ];
        
        mockData.timelineSpecificTips = [
          "Invest time in creative brainstorming sessions with each creator",
          "Develop custom discount codes for accurate attribution tracking",
          "Create a private feedback channel between creators and product team",
          "Schedule mid-campaign optimization sessions based on early data",
          "Allocate budget for amplifying top-performing content"
        ];
        
        mockData.keyPerformanceIndicators = [
          "Long-tail view performance (30-day view counts)",
          "Audience retention metrics across content series",
          "Comment sentiment analysis and question themes",
          "Brand lift metrics (pre and post campaign)",
          "Content effectiveness by format and creator type"
        ];
      }
      else if (timeline.includes("3-6 months") || timeline.includes("6+")) {
        mockData.timelinePlan.title = "Strategic Creator Partnership Program";
        mockData.timelinePlan.overview = "A comprehensive brand ambassador program built around long-term creator relationships and evolving content strategies.";
        mockData.timelinePlan.phases = [
          {
            name: "Research & Strategy (Month 1)",
            duration: "4 weeks",
            description: "Deep audience analysis and creator selection",
            activities: ["Audience segmentation analysis", "Creator landscape evaluation", "Campaign strategy framework development", "Content pillar planning"]
          },
          {
            name: "Creator Partnership Development (Month 2)",
            duration: "4 weeks",
            description: "Building strong creator relationships",
            activities: ["Creator contract negotiation", "Creative workshop sessions", "Brand immersion experiences", "Content calendar development"]
          },
          {
            name: "Initial Content Wave (Month 3)",
            duration: "4 weeks",
            description: "First phase of coordinated content",
            activities: ["Product announcement/unboxing content", "Educational and tutorial content", "Cross-platform supporting content", "Initial performance analysis"]
          },
          {
            name: "Optimization & Expansion (Month 4)",
            duration: "4 weeks",
            description: "Refining approach based on data",
            activities: ["Performance data review", "Strategy refinement", "Second wave content planning", "Community feedback integration"]
          },
          {
            name: "Advanced Content Development (Month 5-6)",
            duration: "8 weeks",
            description: "Deeper, more specialized content",
            activities: ["Advanced use case content", "Comparative analysis videos", "User-requested demonstrations", "Final performance evaluation"]
          }
        ];
        
        mockData.creatorCollaboration.strategy = "Develop true partnerships with a mix of creator tiers, focusing on category experts and audience loyalty rather than just reach.";
        mockData.creatorCollaboration.contractRecommendations = [
          "Long-term ambassador contracts with performance incentives",
          "Phased deliverables schedule with content evolution",
          "Include exclusivity with appropriate compensation",
          "Revenue share options for high-performing creators"
        ];
        mockData.creatorCollaboration.communicationCadence = "Bi-weekly scheduled strategy calls, dedicated Slack/Discord channel, and quarterly in-person planning sessions when possible.";
        mockData.creatorCollaboration.contentRecommendations = [
          "Multi-phase content strategy showing product journey",
          "Mix of announcement, educational, lifestyle, and technical content",
          "Plan for seasonal and trending topic integration",
          "Develop creator-specific narrative arcs with the product"
        ];
        
        mockData.timelineSpecificTips = [
          "Consider bringing key creators into product development feedback loops",
          "Develop creator-specific landing pages for accurate attribution",
          "Plan content refreshes timed with product updates or seasons",
          "Create a shared asset library that grows throughout the campaign",
          "Allocate budget for creator studio upgrades or equipment if needed"
        ];
        
        mockData.keyPerformanceIndicators = [
          "Content effectiveness across campaign phases",
          "Channel growth attribution to campaign",
          "Long-term engagement metrics and audience loyalty",
          "Sales correlation to content publication schedule",
          "Brand sentiment evolution throughout campaign lifecycle"
        ];
      }
      
      return mockData;
    }
}
  
// Export the class
export default GoogleAIService;