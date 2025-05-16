const { Topic } = require('../core/Topic');

class FinanceTopic extends Topic {
  constructor() {
    super({
      name: "personal_finance",
      description: "Integrated money management with cross-topic connections",
      keywords: ["money", "finance", "debt", "savings", "income", "budget"],
      priority: 1.2, // Higher priority for financial queries
      
      patterns: [
        {
          regex: /(no|low|out of|need) money/i,
          responses: [
            "Financial stress is common. %solution might help.",
            "When funds are low, consider %solution.",
            "For money issues, %solution could be useful."
          ],
          crossTopic: ["mental_health", "career_advice"]
        }
      ],
      
      solutions: [
        "tracking all expenses for a week",
        "creating a 50-30-20 budget plan",
        "setting up automatic savings transfers"
      ],
      
      crossTopicHandlers: {
        "mental_health": (input, context) => {
          if (input.match(/(money|finance).*(stress|anxiety|depress)/i)) {
            return {
              response: "Financial stress affects mental health. Try:\n" +
                       "1. Separating money worries from self-worth\n" +
                       "2. Scheduling 'worry time' about finances\n" +
                       "3. Focusing on controllable factors",
              solutions: [
                "gratitude journaling for non-financial positives",
                "free community mental health resources"
              ]
            };
          }
          return null;
        },
        
        "career_advice": (input, context) => {
          if (input.match(/(need|make) (more|extra) money/i)) {
            return {
              response: "To increase income:\n1. Upskill with free courses (%solution)\n" +
                       "2. Negotiate current salary\n3. Explore side gigs",
              solutions: [
                "Coursera financial aid options",
                "Freelance marketplace profiles"
              ]
            };
          }
          return null;
        }
      },
      
      relatedTopics: ["career_advice", "mental_health", "time_management"],
      
      profileExtractors: [
        (input, profile) => {
          const amountMatch = input.match(/\$?(\d{3,})/);
          if (amountMatch) {
            return { 
              incomeRange: parseInt(amountMatch[1]) > 2000 ? "medium" : "low",
              financialMentions: (profile.financialMentions || 0) + 1
            };
          }
          return {};
        }
      ],
      
      memoryTriggers: [
        {
          pattern: /(save|savings)/i,
          store: (input) => ({
            type: "savings_mention",
            data: { text: input, timestamp: new Date() }
          })
        }
      ]
    });
  }

  generateResponse(input, matchResult, context, allTopics) {
    // Special handling for financial emergencies
    if (input.match(/financial emergency|can'?t pay|eviction/i)) {
      return {
        response: "For immediate financial crisis support:\n" +
                 "1. Contact 211 for local resources\n" +
                 "2. Reach out to religious organizations\n" +
                 "3. Apply for emergency assistance",
        immediate: true,
        topic: this.name
      };
    }
    
    // Proceed with normal generation
    return super.generateResponse(input, matchResult, context, allTopics);
  }
}

module.exports = FinanceTopic;