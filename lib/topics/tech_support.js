const BaseTopic = require('../core/Topic');
const natural = require('natural');
const { WordTokenizer } = natural;

class TechSupportTopic extends BaseTopic {
  constructor() {
    super({
      name: "tech_support",
      description: "Provides technology troubleshooting and advice for devices, software, and networks",
      keywords: [
        "computer", "laptop", "phone", "mobile", 
        "wifi", "internet", "software", "hardware", 
        "tech", "device", "printer", "network"
      ],
      priority: 2.5, // Higher than general topics
      
      // Enhanced patterns with better matching
      patterns: [
        {
          regex: /(fix|solve|repair|troubleshoot)\s+(my\s+)?(wifi|internet|network)/i,
          responses: [
            "For %3 issues, try these steps: %solution",
            "Common %3 solutions include: %solution",
            "Network troubleshooting steps: %solution"
          ],
          examples: ["fix my wifi", "internet not working"]
        },
        {
          regex: /(computer|laptop|pc|mac)\s+(slow|freez|crash|not\s+work)/i,
          responses: [
            "For %1 performance issues: %solution",
            "When your %1 is having problems: %solution",
            "Try these %1 optimizations: %solution"
          ],
          examples: ["laptop slow", "computer freezing"]
        },
        {
          regex: /(phone|iphone|android|smartphone)\s+(won't\s+turn|not\s+charg|black\s+screen)/i,
          responses: [
            "Mobile device issues can be frustrating. Try: %solution",
            "For %1 problems: %solution",
            "Common %1 fixes: %solution"
          ],
          examples: ["iphone not charging", "android black screen"]
        }
      ],
      
      // Expanded solutions database
      solutions: [
        "restart your device and router",
        "check for system/software updates",
        "clear cache and temporary files",
        "run antivirus/malware scan",
        "free up storage space (keep 10% free)",
        "check cable connections and power cycles",
        "update device drivers/firmware",
        "try system restore to earlier point"
      ],
      
      // Enhanced device-specific solutions
      deviceSpecific: {
        "windows": [
          "Run the Windows troubleshooter (Settings > Update & Security > Troubleshoot)",
          "Check Task Manager for resource-heavy processes",
          "Use Disk Cleanup utility (cleanmgr)"
        ],
        "mac": [
          "Reset SMC (System Management Controller)",
          "Reset PRAM/NVRAM",
          "Run First Aid in Disk Utility"
        ],
        "iphone": [
          "Force restart (quickly press Volume Up, Volume Down, then hold Side button)",
          "Check for iOS updates (Settings > General > Software Update)",
          "Reset network settings (Settings > General > Reset)"
        ],
        "android": [
          "Boot in Safe Mode (hold Power Off option)",
          "Clear app cache/data (Settings > Apps)",
          "Factory reset (backup data first)"
        ]
      },
      
      // Improved escalation protocol
      escalationProtocol: (input, context) => {
        const escalationKeywords = [
          'not working', 'didn\'t help', 'still broken', 
          'same problem', 'worse now'
        ];
        
        if (new RegExp(escalationKeywords.join('|'), 'i').test(input)) {
          return {
            response: "I recommend these escalation steps:\n" +
                     "1. Contact manufacturer support\n" +
                     "2. Visit a certified repair shop\n" +
                     "3. Check tech community forums\n" +
                     "Would you like help finding local support options?",
            solutions: [
              "manufacturer support links",
              "certified repair locations",
              "tech community resources"
            ],
            metadata: {
              escalation: true,
              urgency: context?.userProfile?.techProficiency === 'low' ? 'high' : 'medium'
            }
          };
        }
        return null;
      },
      
      // Sentiment analysis thresholds
      sentimentThresholds: {
        frustration: -0.7,
        urgency: -0.5
      }
    });
    
    // Initialize NLP tools
    this.tokenizer = new WordTokenizer();
    this.techTerms = new Set(this.config.keywords.map(kw => kw.toLowerCase()));
  }

  generateResponse(input, matchResult, context) {
    // 1. Detect device type
    const device = this.detectDevice(input);
    
    // 2. Get base response from parent class
    let response = super.generateResponse(input, matchResult, context);
    
    // 3. Add device-specific advice if available
    if (device && this.config.deviceSpecific[device]) {
      const deviceTips = this.config.deviceSpecific[device];
      response.response += `\n\nFor ${device} specifically:\n- ${deviceTips.join('\n- ')}`;
      response.solutions = [...new Set([...response.solutions, ...deviceTips])];
    }
    
    // 4. Check for frustration/urgency
    if (context?.nlpAnalysis?.sentiment < this.config.sentimentThresholds.frustration) {
      response.response = "I understand this is frustrating. " + response.response;
      response.metadata.urgent = true;
    }
    
    // 5. Check if escalation needed (30% chance if criteria met)
    if (Math.random() < 0.3) {
      const escalation = this.config.escalationProtocol(input, context);
      if (escalation) {
        return {
          ...escalation,
          topic: this.name,
          metadata: {
            ...response.metadata,
            ...escalation.metadata
          }
        };
      }
    }
    
    return response;
  }

  detectDevice(input) {
    const deviceMap = {
      'windows': ['windows', 'pc', 'surface'],
      'mac': ['mac', 'macbook', 'os x'],
      'iphone': ['iphone', 'apple phone'],
      'android': ['android', 'samsung', 'galaxy', 'pixel']
    };
    
    const inputLower = input.toLowerCase();
    for (const [device, terms] of Object.entries(deviceMap)) {
      if (terms.some(term => inputLower.includes(term))) {
        return device;
      }
    }
    return null;
  }

  // Optional: Add tech term extraction for better profiling
  extractProfileInfo(input, currentProfile = {}) {
    const tokens = this.tokenizer.tokenize(input.toLowerCase());
    const techTermsFound = tokens.filter(token => this.techTerms.has(token));
    
    if (techTermsFound.length > 0) {
      return {
        techInterests: [...new Set([...(currentProfile.techInterests || []), ...techTermsFound])],
        lastTechIssue: tokens.join(' ').slice(0, 100) // Store snippet of issue
      };
    }
    return {};
  }
}

module.exports = TechSupportTopic;