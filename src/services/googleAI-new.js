// services/googleAI.js

/**
 * Service class for integrating with Google's Generative AI (Gemini)
 */
class GoogleAIService {
    /**
     * Constructor
     * @param {string} apiKey - Google AI API key
     */
    constructor(apiKey) {
      this.apiKey = apiKey;
      this.useMock = !apiKey;
      
      if (!this.useMock) {
        this.initializeGemini();
      } else {
        console.log('Using mock Gemini implementation (no API key provided)');
      }
    }
  
    /**
     * Initialize the Gemini API
     */
    async initializeGemini() {
      try {
        // Dynamically import the Google Generative AI SDK
        const module = await import('@google/generative-ai');
        const GoogleGenerativeAI = module.GoogleGenerativeAI;
        
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        console.log('Gemini API initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Gemini API:', error);
        this.useMock = true;
        console.log('Falling back to mock implementation');
      }
    }
  
    /**
     * Generate a campaign plan based on user inputs
     * @param {Object} campaignData - The form data with campaign details
     * @returns {Promise<Object>} - The structured campaign response
     */
    async generateCampaignPlan(campaignData) {
      try {
        if (this.useMock) {
          console.log('Using mock data generator');
          return this.generateMockResponse(campaignData);
        }
        
        console.log('Calling Gemini API with data:', campaignData);
        
        // Create a prompt based on the user input
        const prompt = this.createPrompt(campaignData);
        
        console.log('Sending structured request to Gemini');
        
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
          
          console.log('Received response from Gemini');
          const response = result.response;
          const text = response.text();
          
          // Log sample of response
          console.log('Gemini response preview:', text.substring(0, 200) + '...');
          
          // Parse the text response into structured data
          const parsedResponse = this.parseResponse(text);
          return this.normalizeResponseStructure(parsedResponse);
        } catch (error) {
          console.error('Error generating campaign plan:', error);
          throw error;
        }
      } catch (error) {
        console.error('Error in generateCampaignPlan:', error);
        // Fallback to mock implementation on error
        console.log('Error occurred, falling back to mock data');
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
  
  IMPORTANT GUIDANCE:
  1. Focus on creating a campaign that highlights the specific product features identified in the analysis
  2. Group recommended creators by category/niche (e.g., Tech Reviewers, Beauty Influencers, Lifestyle Vloggers)
  3. Include AT LEAST 5 creators for EACH category, and recommend at least 3-4 different categories relevant to the product
  4. For each creator, include realistic subscriber counts and average view counts that align with the campaign budget
  5. Suggest video concepts that utilize the content styles most appropriate for this product
  6. Include specific ways to measure campaign success based on the product type and campaign goals
  
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
     * Generate a mock response when the API is not available
     * @param {Object} data - The campaign form data
     * @returns {Promise<Object>} - Structured mock campaign data
     */
    generateMockResponse(data) {
      console.log('Generating mock campaign response');
      
      // Create a mock data structure that matches the expected format
      return {
        campaignName: this.generateMockCampaignName(data),
        videoIdeas: this.generateMockVideoIdeas(),
        trackingMetrics: this.generateMockTrackingMetrics(),
        keysToSuccess: this.generateMockKeysToSuccess(),
        // Use the new method that creates more creators per category
        creatorCategories: this.generateMockCreatorCategoriesWithMoreCreators(data)
      };
    }
    
    /**
     * Generate creators for a specific category based on budget
     * @param {string} categoryType - Type of category (Review, Lifestyle, etc.)
     * @param {Object} budgetRange - Budget range min and max
     * @param {Array} keywords - Keywords for personalization
     * @returns {Array} - Array of creator objects
     */
    generateCreatorsForCategory(categoryType, budgetRange, keywords) {
      const creators = [];
      const niches = ['tech', 'lifestyle', 'beauty', 'fitness', 'education', 'gaming', 'fashion', 'food'];
      
      // Determine creator size based on budget
      let subscriberRanges = [];
      if (budgetRange.min < 5000) {
        // Small budget: micro-influencers
        subscriberRanges = ['50K subscribers', '80K subscribers', '120K subscribers', '180K subscribers'];
      } else if (budgetRange.min < 25000) {
        // Medium budget: mid-tier creators
        subscriberRanges = ['250K subscribers', '500K subscribers', '750K subscribers', '950K subscribers'];
      } else {
        // Large budget: larger creators
        subscriberRanges = ['1.2M subscribers', '1.5M subscribers', '2.5M subscribers', '3.5M subscribers'];
      }
      
      // Generate 2-3 creators for this category
      const creatorCount = 2 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < creatorCount; i++) {
        const niche = niches[Math.floor(Math.random() * niches.length)];
        const keyword = keywords[i % keywords.length] || 'content';
        const subscribers = subscriberRanges[Math.floor(Math.random() * subscriberRanges.length)];
        const averageViews = this.getAverageViews(subscribers);
        
        // Determine budget fit
        let budgetFit = 'Medium fit';
        
        // Extract subscriber count as a number
        const subscriberText = subscribers.replace(' subscribers', '');
        const subscriberNum = parseInt(subscriberText.replace(/[^0-9]/g, ''));
        const isMillion = subscriberText.includes('M');
        
        // Low budget (<$5000): Good fit for 50-180K subs
        if (budgetRange.min < 5000) {
          if ((isMillion) || subscriberNum > 200) {
            budgetFit = 'Low fit for your budget';
          } else {
            budgetFit = 'High fit for your budget';
          }
        }
        // Medium budget ($5000-$25000): Good fit for 200K-1M subs 
        else if (budgetRange.min < 25000) {
          if (isMillion && subscriberNum > 1) {
            budgetFit = 'Low fit for your budget';
          } else if (!isMillion && subscriberNum < 200) {
            budgetFit = 'Low fit for your budget';
          } else {
            budgetFit = 'High fit for your budget';
          }
        }
        // High budget (>$25000): Good fit for >1M subs
        else {
          if (isMillion && subscriberNum >= 1) {
            budgetFit = 'High fit for your budget';
          } else {
            budgetFit = 'Low fit for your budget';
          }
        }
        
        // Generate the creator object
        creators.push({
          name: `${this.capitalize(keyword)}${this.capitalize(categoryType)}`,
          description: `Specializing in ${niche} ${categoryType.toLowerCase()} content. Audience demographic aligns well with your target market. Known for high-quality ${this.getRandomKeyword(keywords)} videos with good engagement rates.`,
          channelUrl: `https://youtube.com/c/${keyword}${categoryType.toLowerCase()}`,
          subscribers: subscribers,
          averageViews: averageViews,
          budgetFit: budgetFit
        });
      }
      
      return creators;
    }
    
    // Helper methods for mock data generation
    getRandomKeyword(keywords) {
      if (!keywords.length) return 'product';
      return keywords[Math.floor(Math.random() * keywords.length)];
    }
    
    capitalize(str) {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    getSubscriberCount() {
      const counts = ['500K subscribers', '1.2M subscribers', '750K subscribers', '250K subscribers', '3.5M subscribers'];
      return counts[Math.floor(Math.random() * counts.length)];
    }
    
    getAverageViews(subscribers) {
      // Base conversion rate (views per subscriber)
      // Typically, videos get 10-15% of subscriber count in views
      const subscriberText = subscribers.replace(' subscribers', '');
      const subscriberCount = parseInt(subscriberText.replace(/[^0-9]/g, ''));
      const subscriberUnit = subscriberText.includes('M') ? 1000000 : 1000;
      const actualSubscribers = subscriberCount * subscriberUnit / 1000; // Convert to thousands
      
      // Apply a random conversion factor between 10-20%
      const conversionFactor = (Math.random() * 10 + 10) / 100;
      const averageViews = Math.round(actualSubscribers * conversionFactor);
      
      // Format appropriately
      if (averageViews >= 1000) {
        return `${(averageViews / 1000).toFixed(1)}M`;
      } else {
        return `${averageViews}K`;
      }
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
      
      console.log(`Parsed budget range: $${min} - $${max} from "${budgetStr}"`);
      return { min, max };
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

    // Add this method or modify an existing one to generate more mock creators per category
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
      
      // Get appropriate subscriber counts based on budget
      const budget = campaignData.campaignBudget || '$5,000 - $10,000';
      const creatorSizes = this.getCreatorSizesByBudget(budget);
      
      return selectedCategories.map(categoryName => {
        // Generate 5-8 creators per category
        const numCreators = 5 + Math.floor(Math.random() * 4);
        
        return {
          categoryName,
          creators: Array.from({ length: numCreators }, (_, i) => {
            const subscriberCount = this.getSubscriberCount(creatorSizes);
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
}
  
// Export the class
export default GoogleAIService;