/**
 * Get an estimated price range based on product type
 * @param {string} productType 
 * @returns {string} - Price range
 */
function getEstimatedPrice(productType) {
    const priceRanges = {
      'electronics': '$100 - $1000+',
      'clothing': '$20 - $200',
      'beauty': '$15 - $150',
      'home': '$50 - $500',
      'food': '$10 - $100',
      'unknown': 'Varies'
    };
    
    return priceRanges[productType] || 'Varies';
  }
  
  /**
   * Get target demographic based on product type
   * @param {string} productType 
   * @returns {string} - Target demographic
   */
  function getTargetDemographic(productType) {
    const demographics = {
      'electronics': 'Tech enthusiasts, 18-45',
      'clothing': 'Fashion-conscious, 16-40',
      'beauty': 'Beauty enthusiasts, 18-35',
      'home': 'Home owners, 25-55',
      'food': 'Cooking enthusiasts, 25-65',
      'unknown': 'General audience'
    };
    
    return demographics[productType] || 'General audience';
  }
  
  /**
   * Get key features based on product type
   * @param {string} productType 
   * @returns {Array<string>} - Key features
   */
  function getKeyFeatures(productType) {
    const features = {
      'electronics': ['Innovative technology', 'Performance', 'Connectivity', 'User experience', 'Durability'],
      'clothing': ['Style', 'Comfort', 'Quality materials', 'Versatility', 'Fit'],
      'beauty': ['Effectiveness', 'Ingredients', 'Results', 'Application', 'Value'],
      'home': ['Design', 'Functionality', 'Quality', 'Durability', 'Aesthetics'],
      'food': ['Taste', 'Nutrition', 'Quality ingredients', 'Convenience', 'Value'],
      'unknown': ['Quality', 'Value', 'Design', 'Functionality', 'Performance']
    };
    
    return features[productType] || ['Quality', 'Value', 'Design', 'Functionality', 'Performance'];
  }
  
  /**
   * Get recommended creator types based on product type
   * @param {string} productType 
   * @returns {Array<string>} - Creator types
   */
  function getRecommendedCreatorTypes(productType) {
    const creatorTypes = {
      'electronics': ['Tech reviewers', 'Unboxing channels', 'Tutorial creators'],
      'clothing': ['Fashion influencers', 'Style vloggers', 'Lifestyle creators'],
      'beauty': ['Beauty gurus', 'Makeup artists', 'Skincare experts'],
      'home': ['Home decor channels', 'DIY creators', 'Lifestyle vloggers'],
      'food': ['Cooking channels', 'Food reviewers', 'Recipe creators'],
      'unknown': ['Lifestyle creators', 'Review channels', 'Vloggers']
    };
    
    return creatorTypes[productType] || ['Lifestyle creators', 'Review channels', 'Vloggers'];
  }
  
  /**
   * Get suggested content styles based on product type
   * @param {string} productType 
   * @returns {Array<string>} - Content styles
   */
  function getSuggestedContentStyles(productType) {
    const contentStyles = {
      'electronics': ['Detailed reviews', 'Comparison videos', 'How-to tutorials'],
      'clothing': ['Try-on hauls', 'Styling tips', 'Outfit inspirations'],
      'beauty': ['First impressions', 'Tutorials', 'Before & after demonstrations'],
      'home': ['Home tours', 'Transformation videos', 'DIY projects'],
      'food': ['Recipe tutorials', 'Taste tests', 'Cooking challenges'],
      'unknown': ['Reviews', 'Tutorials', 'Day-in-the-life vlogs']
    };
    
    return contentStyles[productType] || ['Reviews', 'Tutorials', 'Day-in-the-life vlogs'];
  }// src/utils/apiUtils.js
  
  /**
   * Handles fetching product information from a URL using Gemini AI
   * @param {string} url - Product URL to analyze
   * @param {string} apiKey - Google AI API key
   * @returns {Promise<Object>} - Extracted product information
   */
  export const fetchProductInfo = async (url, apiKey) => {
    console.log('fetchProductInfo called with URL:', url);
    console.log('API key available:', !!apiKey);
    
    try {
      // First check if we have an API key
      if (!apiKey) {
        console.warn('No API key provided, using mock product analysis');
        return createMockProductAnalysis(url);
      }
      
      console.log('Calling Gemini API with URL:', url);
      
      // Use Gemini to analyze the product URL
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      // Create a better prompt with marketing specialist context
      const prompt = `Context: You're a marketing specialist, skilled at connecting YouTube creators and merchants. You excel at crafting marketing and ad campaigns to help merchants find the right creators for successful collaborations.
  
  Objective: Analyze this product at URL: ${url}
  
  FORMAT YOUR RESPONSE AS VALID JSON with the following structure:
  {
    "category": "Product category",
    "targetDemographic": "Target audience description",
    "priceRange": "Estimated price range",
    "keyFeatures": [
      "Feature 1",
      "Feature 2",
      "Feature 3",
      "Feature 4",
      "Feature 5"
    ],
    "recommendedContentTypes": [
      "Content type 1",
      "Content type 2",
      "Content type 3"
    ],
    "recommendedCreators": [
      {
        "name": "Real creator name",
        "channelUrl": "Actual YouTube channel URL",
        "subscribers": "Approximate subscriber count",
        "description": "Why they're a good fit for this product"
      },
      {
        "name": "Real creator name 2",
        "channelUrl": "Actual YouTube channel URL",
        "subscribers": "Approximate subscriber count",
        "description": "Why they're a good fit for this product"
      },
      {
        "name": "Real creator name 3",
        "channelUrl": "Actual YouTube channel URL",
        "subscribers": "Approximate subscriber count",
        "description": "Why they're a good fit for this product"
      }
    ]
  }
  
  IMPORTANT NOTES:
  - For recommendedCreators, suggest ACTUAL real YouTube creators who would be a good fit for this specific product
  - Provide real YouTube channel URLs (like https://www.youtube.com/@CreatorName)
  - Focus on identifying the unique selling points of this specific product
  - Analyze the specific product at the URL provided, not just the product type in general
  
  Remember to structure your entire response as valid JSON, nothing else.`;
  
      console.log('Sending prompt to Gemini...');
      
      // Get response from Gemini with safety settings adjusted
      const generationConfig = {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      };
      
      // Try direct text generation first
      try {
        const result = await model.generateContent(prompt);
        console.log('Received response from Gemini via direct text prompt');
        const response = result.response;
        const analysisText = response.text();
        console.log('Gemini raw response length:', analysisText.length);
        
        // Parse the analysis into structured data
        return parseProductAnalysis(url, analysisText);
      } catch (promptError) {
        console.error('Error with direct prompt, trying structured prompt format:', promptError);
        
        // Try with structured format if direct text fails
        try {
          const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig
          });
          
          console.log('Received response from Gemini via structured prompt');
          const response = result.response;
          const analysisText = response.text();
          console.log('Gemini raw response length:', analysisText.length);
          
          // Parse the analysis into structured data
          return parseProductAnalysis(url, analysisText);
        } catch (structuredError) {
          console.error('Error with structured prompt format:', structuredError);
          throw structuredError; // Re-throw to be caught by outer catch block
        }
      }
      
      console.log('Received response from Gemini');
      const response = result.response;
      const analysisText = response.text();
      console.log('Gemini raw response length:', analysisText.length);
      
      // Parse the analysis into structured data
      return parseProductAnalysis(url, analysisText);
    } catch (error) {
      console.error('Error analyzing product with Gemini:', error);
      console.log('Falling back to mock data due to error');
      // Fallback to mock data if API request fails
      return createMockProductAnalysis(url);
    }
  };
  
  /**
   * Parse product analysis from Gemini response text
   * @param {string} url - The product URL
   * @param {string} analysisText - The text response from Gemini
   * @returns {Object} - Structured product analysis
   */
  function parseProductAnalysis(url, analysisText) {
    try {
      // Simple URL parser to extract domain
      const domain = new URL(url).hostname;
      
      console.log('Parsing Gemini response for product analysis:', url);
      console.log('Raw analysis text length:', analysisText.length);
      
      // Try to extract JSON from the response
      let jsonData = null;
      let jsonExtractionError = null;
      
      try {
        // Try to find JSON in the text (in case there's text before/after the JSON)
        const jsonMatch = analysisText.match(/(\{[\s\S]*\})/);
        if (jsonMatch && jsonMatch[0]) {
          jsonData = JSON.parse(jsonMatch[0]);
          console.log('Successfully extracted and parsed JSON from Gemini response');
        } else {
          // If no JSON-like structure found, try parsing the whole text
          jsonData = JSON.parse(analysisText);
          console.log('Successfully parsed full text as JSON');
        }
      } catch (error) {
        jsonExtractionError = error;
        console.warn('Failed to parse JSON from Gemini response:', error.message);
        console.log('Will fall back to text parsing');
      }
      
      // If we successfully parsed JSON
      if (jsonData) {
        // Check if the JSON has the expected structure
        if (jsonData.category && jsonData.keyFeatures && Array.isArray(jsonData.keyFeatures)) {
          // Create structured data from the parsed JSON
          return {
            url,
            domain,
            analysisSource: 'gemini',
            extractedInfo: {
              category: jsonData.category,
              estimatedPrice: jsonData.priceRange || 'Varies',
              targetDemographic: jsonData.targetDemographic || 'General audience',
              keyFeatures: jsonData.keyFeatures || [],
              recommendedCreatorTypes: (jsonData.recommendedCreators || []).map(creator => 
                creator.name || 'Unknown creator'
              ),
              suggestedContentStyles: jsonData.recommendedContentTypes || [],
              recommendedCreators: (jsonData.recommendedCreators || []).map(creator => ({
                name: creator.name || 'Unknown creator',
                description: creator.description || '',
                subscribers: creator.subscribers || 'Unknown',
                channelUrl: creator.channelUrl || `https://youtube.com`
              })),
              rawAnalysis: analysisText
            }
          };
        } else {
          console.warn('JSON from Gemini is missing expected fields');
        }
      }
      
      // If JSON parsing failed or JSON didn't have expected structure, fall back to regex extraction
      console.log('Falling back to regex-based text extraction');
      
      // Extract key information using more robust patterns
      const categoryPattern = /(?:product\s+category|category)[:\s]+"?([^"\n,]+)"?/i;
      const categoryMatch = analysisText.match(categoryPattern);
      const category = categoryMatch ? categoryMatch[1].trim() : 'Unknown';
      
      // Target demographic - look for "Target Demographic:", "Audience:", etc.
      const demographicPattern = /(?:target\s+demographic|audience|demographic|target\s+market)[:\s]+"?([^"\n,]+)"?/i;
      const demographicMatch = analysisText.match(demographicPattern);
      const demographic = demographicMatch ? demographicMatch[1].trim() : 'General audience';
      
      // Price - not always present, but look for it
      const pricePattern = /(?:price|cost|pricing|price\s+range)[:\s]+"?([$€£]?[0-9,.]+\s*(?:-\s*[$€£]?[0-9,.]+)?|affordable|expensive|premium|budget[^"\n,]*)"?/i;
      const priceMatch = analysisText.match(pricePattern);
      const price = priceMatch ? priceMatch[1].trim() : 'Varies';
      
      // Extract features - try multiple patterns
      let features = [];
      
      // First try to find key features in a JSON-like format
      const featuresJsonPattern = /"keyFeatures"(?:\s*:\s*)\[(.*?)\]/s;
      const featuresJsonMatch = analysisText.match(featuresJsonPattern);
      
      if (featuresJsonMatch && featuresJsonMatch[1]) {
        // Extract quoted strings from the array
        const featureMatches = featuresJsonMatch[1].match(/"([^"]*)"/g);
        if (featureMatches) {
          features = featureMatches.map(match => match.replace(/"/g, '').trim());
        }
      }
      
      // If no features found, try other patterns
      if (features.length === 0) {
        // Try to find a Key Features section with a list
        const featuresSectionPattern = /(?:key\s+features|main\s+features|features|strengths)(?:[\s\n]*:[\s\n]*)((?:(?:[-•*]|\d+\.)\s*[^\n]+[\n]?)+)/i;
        const featuresSectionMatch = analysisText.match(featuresSectionPattern);
        
        if (featuresSectionMatch && featuresSectionMatch[1]) {
          // Extract individual list items
          const featuresList = featuresSectionMatch[1].trim();
          const featuresListItems = featuresList.split(/\n/).map(item => {
            // Remove list markers (bullets, numbers)
            return item.replace(/^(?:[-•*]|\d+\.)\s*/, '').trim();
          }).filter(item => item.length > 0);
          
          features = featuresListItems;
        }
      }
      
      // If still no features, look for sentences with "feature" mentions
      if (features.length === 0) {
        const featureSentences = analysisText.match(/[^.!?]*(?:feature|strength|highlight|selling\s+point|benefit)[^.!?]*/gi);
        if (featureSentences) {
          features = featureSentences.map(s => s.trim()).filter(s => s.length > 5 && s.length < 100);
        }
      }
      
      // Limit to 5 features
      features = features.slice(0, 5);
      
      // Extract content types - try multiple patterns
      let contentTypes = [];
      
      // First try to find content types in a JSON-like format
      const contentJsonPattern = /"recommendedContentTypes"(?:\s*:\s*)\[(.*?)\]/s;
      const contentJsonMatch = analysisText.match(contentJsonPattern);
      
      if (contentJsonMatch && contentJsonMatch[1]) {
        // Extract quoted strings from the array
        const contentMatches = contentJsonMatch[1].match(/"([^"]*)"/g);
        if (contentMatches) {
          contentTypes = contentMatches.map(match => match.replace(/"/g, '').trim());
        }
      }
      
      // If no content types found, try other patterns
      if (contentTypes.length === 0) {
        // Try to find content types section
        const contentSectionPattern = /(?:content\s+types|recommended\s+content|content\s+styles|video\s+ideas)(?:[\s\n]*:[\s\n]*)((?:(?:[-•*]|\d+\.)\s*[^\n]+[\n]?)+)/i;
        const contentSectionMatch = analysisText.match(contentSectionPattern);
        
        if (contentSectionMatch && contentSectionMatch[1]) {
          // Extract individual list items
          const contentList = contentSectionMatch[1].trim();
          const contentListItems = contentList.split(/\n/).map(item => {
            // Remove list markers (bullets, numbers)
            return item.replace(/^(?:[-•*]|\d+\.)\s*/, '').trim();
          }).filter(item => item.length > 0);
          
          contentTypes = contentListItems;
        }
      }
      
      // Extract creators - start with JSON pattern
      let creators = [];
      const creatorsJsonPattern = /"recommendedCreators"(?:\s*:\s*)\[(.*?)\]/s;
      const creatorsJsonMatch = analysisText.match(creatorsJsonPattern);
      
      if (creatorsJsonMatch && creatorsJsonMatch[1]) {
        // Try to parse individual creator objects
        const creatorObjects = creatorsJsonMatch[1].split(/\},\s*\{/);
        
        for (const creatorObj of creatorObjects) {
          const nameMatch = creatorObj.match(/"name"(?:\s*:\s*)"([^"]*)"/);
          const urlMatch = creatorObj.match(/"channelUrl"(?:\s*:\s*)"([^"]*)"/);
          const subscribersMatch = creatorObj.match(/"subscribers"(?:\s*:\s*)"([^"]*)"/);
          const descMatch = creatorObj.match(/"description"(?:\s*:\s*)"([^"]*)"/);
          
          if (nameMatch) {
            creators.push({
              name: nameMatch[1].trim(),
              channelUrl: urlMatch ? urlMatch[1].trim() : 'https://youtube.com',
              subscribers: subscribersMatch ? subscribersMatch[1].trim() : 'Unknown',
              description: descMatch ? descMatch[1].trim() : ''
            });
          }
        }
      }
      
      // If no creators found via JSON, try other patterns
      if (creators.length === 0) {
        // Look for creator sections
        const creatorSectionPattern = /(?:recommended\s+creators|best\s+creators|top\s+creators|creators)(?:[\s\n]*:[\s\n]*)((?:(?:[-•*]|\d+\.)\s*[^\n]+[\n]?)+)/i;
        const creatorSectionMatch = analysisText.match(creatorSectionPattern);
        
        if (creatorSectionMatch && creatorSectionMatch[1]) {
          // Extract individual creator entries
          const creatorList = creatorSectionMatch[1].trim();
          const creatorItems = creatorList.split(/\n(?:[-•*]|\d+\.)/).filter(Boolean);
          
          for (const item of creatorItems) {
            // Try to extract name, URL, and description
            const channelUrlMatch = item.match(/(?:https?:\/\/(?:www\.)?youtube\.com\/[@a-zA-Z0-9\-_]+)/i);
            const nameMatch = item.match(/^([A-Za-z0-9 .,&'\-_]+)(?:\s*[-–:]\s*|\s*\(|\s*with|\s*who)/i);
            
            if (nameMatch || channelUrlMatch) {
              const name = nameMatch ? nameMatch[1].trim() : 'Unknown creator';
              const channelUrl = channelUrlMatch ? channelUrlMatch[0].trim() : 'https://youtube.com';
              const subscribers = item.match(/(\d+(?:\.\d+)?[KkMm]?\s*(?:subscribers|subs|followers))/i);
              
              creators.push({
                name: name,
                channelUrl: channelUrl,
                subscribers: subscribers ? subscribers[1].trim() : 'Unknown',
                description: item.trim()
              });
            }
          }
        }
      }
      
      // If still no creators found, create generic placeholders
      if (creators.length === 0) {
        const creatorTypes = ['vlogger', 'reviewer', 'educator', 'entertainer', 'expert'];
        for (let i = 0; i < 3; i++) {
          creators.push({
            name: `YouTube ${creatorTypes[i % creatorTypes.length]}`,
            channelUrl: `https://youtube.com`,
            subscribers: 'Unknown',
            description: `No specific creators identified. Consider searching for ${creatorTypes[i % creatorTypes.length]}s in your product niche.`
          });
        }
      }
      
      // Create creator types from the actual creator names
      const creatorTypes = creators.map(creator => {
        return `${creator.name} (${creator.subscribers})`;
      });
      
      // Ensure we have some content types
      if (contentTypes.length === 0) {
        contentTypes = [
          'Product reviews',
          'How-to tutorials',
          'Unboxing videos'
        ];
      }
      
      // Create final structured response
      return {
        url,
        domain,
        analysisSource: 'gemini',
        extractedInfo: {
          category,
          estimatedPrice: price,
          targetDemographic: demographic,
          keyFeatures: features,
          recommendedCreatorTypes: creatorTypes.slice(0, 3),
          suggestedContentStyles: contentTypes.slice(0, 3),
          recommendedCreators: creators,
          rawAnalysis: analysisText
        }
      };
    } catch (error) {
      console.error('Error parsing Gemini analysis:', error);
      return createMockProductAnalysis(url);
    }
  }
  
  /**
   * Create mock product analysis when Gemini API is unavailable
   * @param {string} url - The product URL
   * @returns {Object} - Mock product analysis
   */
  function createMockProductAnalysis(url) {
    try {
      // Get domain and guess product type
      const domain = new URL(url).hostname;
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      
      // Extract product type from URL or domain
      let productType = 'unknown';
      
      if (url.includes('electronics') || domain.includes('tech') || domain.includes('electronic')) {
        productType = 'electronics';
      } else if (url.includes('clothing') || url.includes('fashion') || url.includes('wear')) {
        productType = 'clothing';
      } else if (url.includes('beauty') || url.includes('makeup') || url.includes('skincare')) {
        productType = 'beauty';
      } else if (url.includes('home') || url.includes('furniture') || url.includes('decor')) {
        productType = 'home';
      } else if (url.includes('food') || url.includes('grocery') || url.includes('meal')) {
        productType = 'food';
      } else {
        // Try to guess from domain name
        const commonWords = ['electronics', 'tech', 'gadget', 'clothing', 'fashion', 'apparel', 
                            'beauty', 'makeup', 'cosmetic', 'home', 'furniture', 'food', 'grocery'];
        
        for (const word of commonWords) {
          if (domain.includes(word)) {
            productType = word;
            break;
          }
        }
      }
      
      return {
        url,
        domain,
        analysisSource: 'mock',
        extractedInfo: {
          category: productType,
          estimatedPrice: getEstimatedPrice(productType),
          targetDemographic: getTargetDemographic(productType),
          keyFeatures: getKeyFeatures(productType),
          recommendedCreatorTypes: getRecommendedCreatorTypes(productType),
          suggestedContentStyles: getSuggestedContentStyles(productType)
        }
      };
    } catch (error) {
      console.error('Error creating mock product analysis:', error);
      
      // Return minimal mock data if everything fails
      return {
        url,
        analysisSource: 'mock',
        error: 'Failed to analyze product information',
        extractedInfo: {
          category: 'Unknown',
          estimatedPrice: 'Varies',
          targetDemographic: 'General audience',
          keyFeatures: ['Quality', 'Value', 'Design', 'Functionality', 'Performance'],
          recommendedCreatorTypes: ['Review channels', 'Lifestyle vloggers', 'How-to channels'],
          suggestedContentStyles: ['Reviews', 'Tutorials', 'Day-in-the-life videos']
        }
      };
    }
  }