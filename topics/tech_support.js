const BaseTopic = require('../core/Topic');

class TechSupportTopic extends BaseTopic {
  constructor() {
    super({
      name: "tech_support",
      description: "Provides technology troubleshooting and advice",
      keywords: ["computer", "phone", "wifi", "software", "hardware", "tech"],
      
      patterns: [
        {
          regex: /(fix|solve) (wifi|internet)/i,
          responses: [
            "Common wifi solutions: %solution",
            "Try these steps: %solution",
            "Network troubleshooting: %solution"
          ]
        },
        {
          regex: /(computer|laptop) (slow|freez)/i,
          responses: [
            "Performance fixes: %solution",
            "For faster operation: %solution",
            "Try these optimizations: %solution"
          ]
        }
      ],
      
      solutions: [
        "restart router and device",
        "check for system updates",
        "clear cache and temporary files",
        "run antivirus scan",
        "free up disk space"
      ],
      
      deviceSpecific: {
        "windows": "Run disk cleanup utility",
        "mac": "Reset SMC and PRAM",
        "iphone": "Force restart by quickly pressing volume up, down, then hold power"
      },
      
      escalationProtocol: (input) => {
        if (input.match(/still not working|didn't help/i)) {
          return {
            response: "I recommend:\n1. Contacting manufacturer support\n" +
                     "2. Visiting a repair shop\n3. Checking community forums",
            solutions: [
              "manufacturer support links",
              "local repair shop finder",
              "tech forum search"
            ]
          };
        }
        return null;
      }
    });
  }

  generateResponse(input, matchResult, context) {
    // Check for device-specific queries
    const deviceMatch = input.match(/windows|mac|iphone|android/i);
    if (deviceMatch) {
      const device = deviceMatch[0].toLowerCase();
      if (this.config.deviceSpecific[device]) {
        return {
          response: `For ${device}: ${this.config.deviceSpecific[device]}. Also try: %solution`,
          topic: this.name,
          solutions: this.config.solutions
        };
      }
    }
    
    // Proceed with normal response generation
    const response = super.generateResponse(input, matchResult, context);
    
    // Check if we need to escalate
    const escalation = this.config.escalationProtocol(input);
    if (escalation && Math.random() > 0.7) { // 30% chance to escalate
      return escalation;
    }
    
    return response;
  }
}

module.exports = TechSupportTopic;