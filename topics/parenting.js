const BaseTopic = require('../core/Topic');

class ParentingTopic extends BaseTopic {
  constructor() {
    super({
      name: "parenting",
      description: "Provides child development and parenting strategies",
      keywords: ["child", "parent", "baby", "toddler", "discipline", "sleep"],
      
      patterns: [
        {
          regex: /(baby|infant) (not sleeping|waking)/i,
          responses: [
            "%1 sleep solutions: %solution",
            "Sleep training methods: %solution",
            "Try this approach: %solution"
          ]
        },
        {
          regex: /(toddler|child) (tantrum|meltdown)/i,
          responses: [
            "Managing %2s: %solution",
            "Effective discipline: %solution",
            "Developmental strategies: %solution"
          ]
        }
      ],
      
      solutions: [
        "consistent bedtime routine",
        "positive reinforcement",
        "redirection for unwanted behaviors",
        "age-appropriate expectations",
        "calm parental responses"
      ],
      
      ageGroups: {
        "infant": "0-12 months",
        "toddler": "1-3 years",
        "preschool": "3-5 years"
      },
      
      developmentalMilestones: {
        "12mo": "1-2 words, stands with support",
        "24mo": "50+ words, 2-word phrases"
      },
      
      safetyProtocol: (input) => {
        if (input.match(/choking|poison|fall|unconscious/i)) {
          return {
            response: "For immediate safety concerns:\n1. Ensure child's safety\n" +
                     "2. Call Poison Control (1-800-222-1222) or 911 if emergency",
            immediate: true
          };
        }
        return null;
      }
    });
  }

  generateResponse(input, matchResult, context) {
    // Check safety first
    const safety = this.config.safetyProtocol(input);
    if (safety) return safety;
    
    // Add age-specific advice
    const ageMatch = input.match(/\d+\s*(month|year)/i);
    if (ageMatch) {
      const months = ageMatch[0].includes('year') ? 
        parseInt(ageMatch[0]) * 12 : parseInt(ageMatch[0]);
      
      if (months < 12) {
        return {
          response: `For infants (${this.config.ageGroups.infant}): ${this.config.solutions[0]}. Milestones: ${this.config.developmentalMilestones['12mo']}`,
          topic: this.name
        };
      }
    }
    
    return super.generateResponse(input, matchResult, context);
  }
}

module.exports = ParentingTopic;