<!-- src/components/EmailTemplate.vue -->
<template>
    <div class="modal" v-if="show">
      <div class="modal-content">
        <span class="close-btn" @click="onClose">&times;</span>
        <h3>Email Template for {{ creator.name }}</h3>
        
        <div class="collaboration-type-selector">
          <label for="collaborationType">Collaboration Type:</label>
          <select id="collaborationType" v-model="selectedCollaborationType" class="collaboration-dropdown">
            <option v-for="(option, index) in collaborationTypes" :key="index" :value="option">
              {{ option }}
            </option>
          </select>
        </div>
        
        <div class="collaboration-details">
          <h4>{{ selectedCollaborationType }} Details:</h4>
          <div v-if="getCollaborationDetails()">
            <p><strong>What it is:</strong> {{ getCollaborationDetails().whatItIs }}</p>
            <p><strong>Best for:</strong> {{ getCollaborationDetails().bestFor }}</p>
          </div>
        </div>
        
        <div class="email-template">
          <p><strong>Subject:</strong> {{ getTargetedEmailContent().subject }}</p>
          <p>Hi {{ creator.name }},</p>
          <p>I hope this email finds you well. My name is [Your Name] from [Your Company], and we're big fans of your content on YouTube.</p>
          <p>{{ getTargetedEmailContent().intro }}</p>
          <p>Campaign details:</p>
          <ul>
            <li><strong>Budget:</strong> {{ budget }}</li>
            <li><strong>Timeline:</strong> {{ timeline }}</li>
            <li><strong>Goals:</strong> {{ goals }}</li>
            <li><strong>Collaboration Type:</strong> {{ selectedCollaborationType }}</li>
          </ul>
          <div v-if="getTargetedEmailContent().additionalDetails">
            <p><strong>What we're looking for:</strong></p>
            <ul>
              <li v-for="(detail, index) in getTargetedEmailContent().additionalDetails" :key="index">
                {{ detail }}
              </li>
            </ul>
          </div>
          <p>{{ getTargetedEmailContent().valueProposition }}</p>
          <p>We particularly enjoyed your content on {{ getCreatorStrength() }} and feel it aligns perfectly with our brand values. {{ getTargetedEmailContent().personalization }}</p>
          <p>{{ getTargetedEmailContent().callToAction }}</p>
          <p>Looking forward to your response!</p>
          <p>Best regards,</p>
          <p>[Your Name]<br>[Your Position]<br>[Your Company]<br>[Your Contact Information]</p>
        </div>
        <div class="button-group">
          <button @click="copyEmailTemplate" class="copy-btn">Copy Email</button>
          <button @click="onClose" class="close-email-btn">Close</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed } from 'vue';
  
  export default {
    name: 'EmailTemplate',
    props: {
      show: {
        type: Boolean,
        default: false
      },
      creator: {
        type: Object,
        default: () => ({
          name: '',
          description: '',
          channelUrl: ''
        })
      },
      campaignInfo: {
        type: Object,
        default: () => ({
          budget: '',
          timeline: '',
          goals: '',
          productInfo: ''
        })
      }
    },
    emits: ['close', 'copy'],
    setup(props, { emit }) {
      const collaborationTypes = [
        'Sponsored Integration/Segment',
        'Dedicated Review Video',
        'Product Placement',
        'Tutorial / How-To',
        'Giveaways & Contests',
        'Challenge Participation',
        'Haul Videos',
        'Co-Created Content/Series',
        'Event Coverage / Vlogging',
        'YouTube Shorts Integration'
      ];
      
      const selectedCollaborationType = ref(collaborationTypes[0]);
      
      const budget = computed(() => props.campaignInfo.budget || '[Budget Range]');
      const timeline = computed(() => props.campaignInfo.timeline || '[Timeline]');
      const goals = computed(() => {
        if (props.campaignInfo.goals) {
          return props.campaignInfo.goals.length > 100 
            ? props.campaignInfo.goals.substring(0, 100) + '...'
            : props.campaignInfo.goals;
        }
        return '[Campaign Goals]';
      });
      const productInfo = computed(() => props.campaignInfo.productInfo);
      const productName = computed(() => {
        return props.campaignInfo.productInfo ? 'our product' : '[Product Name]';
      });
      
      const getCollaborationDetails = () => {
        const details = {
          'Sponsored Integration/Segment': {
            whatItIs: 'The creator integrates a dedicated segment (usually 60-120 seconds) within their regular video content to talk about the brand, product, or service. This is often introduced clearly as a sponsorship.',
            bestFor: 'Brand awareness, driving traffic (with links/codes), product feature highlights within relevant content.'
          },
          'Dedicated Review Video': {
            whatItIs: 'The entire video is focused on reviewing the brand\'s product or service. This can be an unboxing, first impressions, in-depth testing, or comparison.',
            bestFor: 'Driving consideration and purchase, showcasing product benefits and features in detail, building trust through perceived objectivity (even when sponsored).'
          },
          'Product Placement': {
            whatItIs: 'The product appears naturally (or sometimes more prominently) within the creator\'s video content without necessarily being the main focus. Disclosure is still required if it\'s a paid placement.',
            bestFor: 'Increasing brand visibility and association, normalizing the product within a specific lifestyle or context.'
          },
          'Tutorial / How-To': {
            whatItIs: 'The creator shows their audience how to use the product or service to achieve a specific outcome relevant to their niche (e.g., a cooking channel using a specific appliance, a beauty guru creating a look with specific makeup).',
            bestFor: 'Demonstrating product value and ease of use, educating consumers, driving purchase intent for products with a learning curve.'
          },
          'Giveaways & Contests': {
            whatItIs: 'The creator hosts a giveaway featuring the brand\'s product as the prize. Often requires audience engagement (likes, comments, subscribing, visiting a brand\'s site) to enter.',
            bestFor: 'Rapidly increasing engagement, growing email lists (if entry requires signup), generating buzz and excitement, rewarding the creator\'s community.'
          },
          'Challenge Participation': {
            whatItIs: 'The brand creates a specific challenge or trend, and collaborates with creators to participate and encourage their audience to join in (often using a specific hashtag).',
            bestFor: 'Generating user-generated content (UGC), creating viral potential, broad brand awareness, community building.'
          },
          'Haul Videos': {
            whatItIs: 'Particularly popular in fashion, beauty, and lifestyle niches. The creator showcases multiple items they\'ve recently acquired, including the sponsored product(s).',
            bestFor: 'Introducing new products, showing products in context with others, driving desire and purchase intent.'
          },
          'Co-Created Content/Series': {
            whatItIs: 'A deeper partnership where the brand and creator collaborate on a specific video or even a series of videos built around a shared theme or narrative that aligns with the brand\'s message.',
            bestFor: 'Storytelling, building deeper brand affinity, long-term partnerships, creating highly engaging and unique content.'
          },
          'Event Coverage / Vlogging': {
            whatItIs: 'The creator attends a brand-sponsored event (product launch, conference, experience) and creates content (like a vlog) documenting their experience.',
            bestFor: 'Generating excitement around events, providing behind-the-scenes access, leveraging the creator\'s perspective to showcase an experience.'
          },
          'YouTube Shorts Integration': {
            whatItIs: 'Utilizing YouTube\'s short-form video format for quick promotions, highlights, participation in trends/challenges, or teasers related to the campaign.',
            bestFor: 'Quick bursts of awareness, reaching audiences who prefer short-form content, complementing longer-form campaign elements.'
          }
        };
        
        return details[selectedCollaborationType.value];
      };
      
      const getTargetedEmailContent = () => {
        const content = {
          'Sponsored Integration/Segment': {
            subject: `Sponsored Integration Opportunity with [Your Brand] (${budget.value})`,
            intro: `We're launching a campaign for ${productName.value} and believe your authentic style and engaged audience would be perfect for a sponsored integration within your regular content.`,
            additionalDetails: [
              'A 60-90 second dedicated segment within one of your videos',
              'Creative freedom to present our product in your authentic voice',
              'Natural integration with your existing content style',
              'Inclusion of key messaging points (which we will provide)'
            ],
            valueProposition: `Our product aligns well with your audience's interests, and we've seen great engagement with similar integrations in the past. We're happy to provide the product well in advance to give you time to experience it fully.`,
            personalization: `Your approach to sponsored content is always authentic and engaging, which is exactly the kind of partnership we're looking for.`,
            callToAction: `Would you be interested in discussing a potential sponsored integration? We're flexible on timing and would love to hear your creative ideas for how to incorporate our product into your content.`
          },
          'Dedicated Review Video': {
            subject: `Dedicated Review Video Opportunity for ${productName.value}`,
            intro: `We'd like to invite you to create a dedicated review video for ${productName.value}. Given your expertise and trusted voice in this space, we believe your audience would value your in-depth perspective on our product.`,
            additionalDetails: [
              'A full video dedicated to reviewing our product',
              'Honest opinions and authentic feedback',
              'Highlighting key features and benefits',
              'Demonstration of the product in use'
            ],
            valueProposition: `We're confident in our product's quality and value, and we believe your thorough and honest review style would be perfect to showcase what makes it special. We'll provide all the information and support you need to create comprehensive content.`,
            personalization: `Your detailed and authentic approach to product reviews resonates strongly with viewers seeking informed opinions.`,
            callToAction: `Would you be interested in creating a dedicated review? We're happy to provide the product with ample time for testing before filming, and we welcome your questions about specifications or features.`
          },
          'Product Placement': {
            subject: `Natural Product Placement Partnership for Your Channel`,
            intro: `We're looking to partner with creators like you for subtle yet effective product placement of ${productName.value} within your regular content. Your authentic style and production quality make your channel an ideal fit.`,
            additionalDetails: [
              'Natural inclusion of our product within your content',
              'Organic presentation in a way that feels authentic to your style',
              'Brief but meaningful visibility of the product',
              'Standard FTC disclosure of the partnership'
            ],
            valueProposition: `Our product would integrate seamlessly into your content style without disrupting your usual flow or theme. We believe in subtle brand presence that adds value rather than distracts.`,
            personalization: `The natural way you incorporate products into your content always feels genuine rather than forced.`,
            callToAction: `Would this type of subtle integration interest you? We'd love to discuss how our product could appear naturally in your upcoming content in a way that respects your creative vision.`
          },
          'Tutorial / How-To': {
            subject: `Tutorial/How-To Video Collaboration with [Your Brand]`,
            intro: `We'd like to partner with you on a tutorial/how-to video featuring ${productName.value}. Your skill at explaining complex concepts and creating educational content makes you an ideal collaborator.`,
            additionalDetails: [
              'A step-by-step tutorial showing how to use our product',
              'Highlighting key features and use cases',
              'Tips and tricks for getting the most out of the product',
              'Creative applications that would interest your audience'
            ],
            valueProposition: `Our product has several interesting features that your audience would benefit from learning about. A tutorial from a trusted voice like yours helps potential customers understand the full value and capabilities of what we offer.`,
            personalization: `Your tutorial style breaks down information in a clear and engaging way that helps viewers truly understand how to get the most from products.`,
            callToAction: `Would you be interested in creating a tutorial featuring our product? We can provide technical specifications, usage tips, and even suggestions for creative applications, while leaving the final approach to your expertise.`
          },
          'Giveaways & Contests': {
            subject: `Product Giveaway Opportunity for Your Audience`,
            intro: `We'd like to sponsor a giveaway of ${productName.value} for your audience. This would be a great way to generate excitement and reward your community while introducing them to our brand.`,
            additionalDetails: [
              'Multiple units of our product available for your audience',
              'Flexibility on contest rules and entry methods',
              'Support for promoting the giveaway',
              'Opportunity to create excitement and engagement with your community'
            ],
            valueProposition: `Giveaways typically generate high engagement and goodwill. Your audience gets a chance to win something valuable, and we get to introduce our brand to potential customers in a positive context.`,
            personalization: `The community you've built is so engaged and supportive - we'd love to offer something special to them as a thank you for that dedication.`,
            callToAction: `Would you be interested in hosting a giveaway for your audience? We're open to your ideas on how to structure the contest to best engage your specific community and can handle the logistics of prize fulfillment.`
          },
          'Challenge Participation': {
            subject: `Join Our Creative Challenge Campaign with ${productName.value}`,
            intro: `We're launching a creative challenge around ${productName.value} and would love for you to participate and invite your audience to join in. Your creative approach and engaged community make you perfect for this campaign.`,
            additionalDetails: [
              'Participation in our [Challenge Name/Theme] campaign',
              'Creating your own interpretation of the challenge using our product',
              'Encouraging your audience to create their own versions with a dedicated hashtag',
              'Potential to feature the best community submissions'
            ],
            valueProposition: `This challenge will generate creative content from both you and your audience, creating a ripple effect of engagement. It's a fun way to showcase our product while building community interaction.`,
            personalization: `The creative challenges you've participated in previously have always showcased your unique perspective while inspiring your audience.`,
            callToAction: `Would you be interested in participating in and promoting this challenge? We'd love to discuss the concept further and hear your ideas on how to make it most relevant to your audience.`
          },
          'Haul Videos': {
            subject: `Include Our Product in Your Next Haul Video`,
            intro: `We'd love to have ${productName.value} featured in one of your upcoming haul videos. Your honest and engaging approach to showcasing multiple products makes your channel an ideal platform.`,
            additionalDetails: [
              'Inclusion of our product in your next haul video',
              'Brief but meaningful coverage alongside other items',
              'Your genuine first impressions and thoughts',
              'Mention of key features that stand out to you'
            ],
            valueProposition: `Haul videos provide an excellent way to introduce products in a context where viewers are already interested in discovering new items. Our product would complement the other items in your haul while standing out for its unique features.`,
            personalization: `Your haul videos strike a perfect balance between informative and entertaining, giving viewers a realistic sense of each product.`,
            callToAction: `Would you be interested in including our product in an upcoming haul video? We're flexible with timing and can ship the product whenever works best for your content schedule.`
          },
          'Co-Created Content/Series': {
            subject: `Co-Created Content Series Partnership Opportunity`,
            intro: `We're looking to develop a co-created content series built around ${productName.value} and themes that align with both our brand values and your channel's focus. Your creative storytelling and production quality make you an ideal partner for this deeper collaboration.`,
            additionalDetails: [
              'A series of 2-3 videos built around a shared theme',
              'Collaborative planning of content concepts',
              'Integration of our product in a meaningful narrative context',
              'Potential for cross-promotion across both our platforms'
            ],
            valueProposition: `This type of deeper partnership allows for more creative storytelling and brand integration than one-off sponsorships. It gives us the opportunity to build something unique together that provides genuine value to your audience while showcasing our product in context.`,
            personalization: `The narrative approach you take with your content creates a much more meaningful connection with viewers than typical product features.`,
            callToAction: `Would you be interested in exploring a co-created content series? We'd love to schedule a call to brainstorm concepts that would resonate with your audience while highlighting our brand values.`
          },
          'Event Coverage / Vlogging': {
            subject: `Invitation to Cover Our Upcoming Event as a Content Creator`,
            intro: `We'd like to invite you to our upcoming [event name/type] to create vlog-style content sharing the experience with your audience. Your engaging personality and storytelling approach make you perfect for this opportunity.`,
            additionalDetails: [
              'All-expenses-paid invitation to our event on [potential date]',
              'Behind-the-scenes access not available to the general public',
              'Opportunity to experience ${productName.value} firsthand in a unique setting',
              'Freedom to create authentic content about your experience'
            ],
            valueProposition: `Event coverage provides a unique, experience-based way to showcase our brand and product. Your audience gets to vicariously attend through your perspective, creating an engaging and different type of content from standard reviews or features.`,
            personalization: `Your vlog-style content always makes viewers feel like they're right there with you, which is exactly the immersive experience we want to create.`,
            callToAction: `Would you be interested in attending and covering this event? We can provide more details about the specifics, and we're flexible in working with your schedule and content approach.`
          },
          'YouTube Shorts Integration': {
            subject: `YouTube Shorts Integration Partnership for ${productName.value}`,
            intro: `We're looking to feature ${productName.value} in creative, eye-catching YouTube Shorts content. Your engaging short-form content and visual style make your channel a perfect fit for this format.`,
            additionalDetails: [
              'Creation of 1-2 YouTube Shorts featuring our product (15-60 seconds each)',
              'Quick, engaging showcase of a key feature or use case',
              'Creative freedom to make the content match your style',
              'Potential for additional posting on other social platforms if desired'
            ],
            valueProposition: `Shorts provide a quick, engaging way to highlight our product to viewers who prefer bite-sized content. The format is perfect for showcasing immediate visual appeal and creating shareable moments.`,
            personalization: `Your Shorts content always manages to be both concise and impactful - exactly what we're looking for in this collaboration.`,
            callToAction: `Would you be interested in creating Shorts content featuring our product? This would be a lower time commitment than long-form content but still provide great value to both your audience and our brand awareness.`
          }
        };
        
        // Default content if the selected type isn't in our mapping
        const defaultContent = {
          subject: `${selectedCollaborationType.value} Collaboration Opportunity with [Your Brand]`,
          intro: `We're looking to launch a campaign for ${productName.value} and believe your authentic style and audience would be a perfect match for a ${selectedCollaborationType.value} collaboration.`,
          additionalDetails: null,
          valueProposition: getCollaborationSpecificText(),
          personalization: `Your content style and audience demographics align perfectly with what we're looking for in a partner.`,
          callToAction: `Would you be interested in discussing this opportunity further? We'd love to schedule a call to share more details and hear your creative ideas for how we could work together.`
        };
        
        return content[selectedCollaborationType.value] || defaultContent;
      };
      
      const getCollaborationSpecificText = () => {
        switch (selectedCollaborationType.value) {
          case 'Sponsored Integration/Segment':
            return 'We envision a natural integration of our product within your regular content, allowing you to maintain your authentic style while featuring our product.';
          case 'Dedicated Review Video':
            return 'We would like you to create an in-depth review video showcasing our product features, benefits, and your honest opinion about it.';
          case 'Product Placement':
            return 'We are looking for subtle yet effective placement of our product in your content, where it would appear naturally in the setting.';
          case 'Tutorial / How-To':
            return 'We would love to see you create a tutorial demonstrating how to use our product, highlighting its key features and benefits.';
          case 'Giveaways & Contests':
            return 'We are interested in sponsoring a giveaway where your audience can win our products, creating engagement and excitement around the brand.';
          case 'Challenge Participation':
            return 'We are launching a challenge related to our product and would love for you to participate and invite your audience to join in.';
          case 'Haul Videos':
            return 'We would like to include our products in one of your haul videos, where you can showcase them alongside other items.';
          case 'Co-Created Content/Series':
            return 'We are looking to collaborate on a content series that aligns with both our brand values and your channel content theme.';
          case 'Event Coverage / Vlogging':
            return 'We would like to invite you to cover our upcoming event and share the experience with your audience through a vlog-style video.';
          case 'YouTube Shorts Integration':
            return 'We are interested in featuring our product in your YouTube Shorts content, utilizing the vertical video format for quick, engaging product highlights.';
          default:
            return 'We believe our product would be a perfect fit for your content style and would love to discuss specific collaboration ideas with you.';
        }
      };
      
      const getCreatorStrength = () => {
        // Extract a strength from the creator description or default to a generic one
        const description = props.creator.description || '';
        const keywords = ['reviews', 'tutorials', 'vlogs', 'unboxing', 'comedy', 'lifestyle', 'tech'];
        
        for (const keyword of keywords) {
          if (description.toLowerCase().includes(keyword)) {
            return keyword;
          }
        }
        
        return 'unique content style';
      };
      
      const copyEmailTemplate = () => {
        const emailText = document.querySelector('.email-template').innerText;
        navigator.clipboard.writeText(emailText)
          .then(() => {
            emit('copy');
          })
          .catch(err => {
            console.error('Failed to copy: ', err);
          });
      };
      
      const onClose = () => {
        emit('close');
      };
      
      return {
        budget,
        timeline,
        goals,
        productInfo,
        productName,
        collaborationTypes,
        selectedCollaborationType,
        getCollaborationSpecificText,
        getCollaborationDetails,
        getTargetedEmailContent,
        getCreatorStrength,
        copyEmailTemplate,
        onClose
      };
    }
  };
  </script>
  
  <style scoped>
  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal-content {
    background-color: white;
    padding: 30px;
    border-radius: 8px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
  }
  
  .close-btn {
    position: absolute;
    top: 15px;
    right: 20px;
    font-size: 24px;
    cursor: pointer;
    color: #606060;
  }
  
  .collaboration-type-selector {
    margin: 15px 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .collaboration-type-selector label {
    font-weight: 500;
    color: var(--secondary-color, #282828);
  }
  
  .collaboration-dropdown {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    font-family: inherit;
    background-color: white;
  }
  
  .collaboration-details {
    margin: 15px 0;
    padding: 12px;
    background-color: #f8f9fa;
    border-radius: 4px;
    border-left: 3px solid var(--primary-color, #ff0000);
  }
  
  .collaboration-details h4 {
    margin-bottom: 8px;
    color: var(--secondary-color, #282828);
    font-size: 0.95em;
  }
  
  .collaboration-details p {
    margin-bottom: 8px;
    font-size: 0.9em;
  }
  
  .email-template {
    margin: 20px 0;
    padding: 15px;
    background-color: #f5f5f5;
    border-radius: 4px;
    white-space: pre-line;
  }

  .email-template ul {
    margin: 10px 0;
    padding-left: 20px;
  }

  .email-template li {
    margin-bottom: 5px;
  }
  
  .button-group {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
  }
  
  .copy-btn {
    padding: 10px 15px;
    background-color: #282828;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s;
  }
  
  .close-email-btn {
    padding: 10px 15px;
    background-color: #f5f5f5;
    color: #282828;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s;
  }
  
  .copy-btn:hover {
    background-color: #000;
  }
  
  .close-email-btn:hover {
    background-color: #eee;
  }
  </style>