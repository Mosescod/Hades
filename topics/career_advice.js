const BaseTopic = require('../core/Topic');

class CareerTopic extends BaseTopic {
  constructor() {
    super({
      name: "career_advice",
      description: "Provides career development and job search guidance",
      keywords: ["job", "career", "resume", "interview", "promotion", "salary"],
      
      patterns: [
        {
          regex: /(improve|better) (resume|CV)/i,
          responses: [
            "Strong resumes often: %solution",
            "For better resumes: %solution",
            "Try this resume tip: %solution"
          ]
        },
        {
          regex: /(answer|handle) interview (question|questions)/i,
          responses: [
            "Interview success comes from: %solution",
            "For tough questions: %solution",
            "Try this strategy: %solution"
          ]
        }
      ],
      
      solutions: [
        "quantify achievements with numbers",
        "use the STAR method for behavioral questions",
        "research company values before interviewing",
        "negotiate salary using market data",
        "develop 30-60-90 day plan for promotions"
      ],
      
      crossTopicHandlers: {
        "personal_finance": (input) => {
          if (input.match(/salary|raise|negotiat/i)) {
            return {
              response: "For salary negotiations:\n1. Research market rates\n" +
                       "2. Highlight your value\n3. Practice your talking points\n" +
                       "Would you like industry-specific salary data?",
              solutions: [
                "Glassdoor research",
                "salary calculator tools",
                "negotiation script templates"
              ]
            };
          }
          return null;
        }
      },
      
      industryData: {
        "tech": "Average 10-15% salary growth when changing jobs",
        "healthcare": "Clinical roles see 5-7% annual raises"
      }
    });
  }

  getSolution(input, context) {
    // Provide industry-specific solutions if available
    if (context.userProfile?.industry) {
      const industry = context.userProfile.industry.toLowerCase();
      if (this.config.industryData[industry]) {
        return `${this.config.solutions[0]} (${this.config.industryData[industry]})`;
      }
    }
    return super.getSolution(input, context);
  }
}

module.exports = CareerTopic;