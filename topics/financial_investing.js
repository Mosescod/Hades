const { Topic } = require('../core/Topic');

class InvestingTopic extends Topic {
  constructor() {
    super({
      name: "financial_investing",
      description: "Provides guidance on investing and wealth building",
      keywords: ["invest", "stock", "portfolio", "retirement", "401k", "IRA"],
      
      patterns: [
        {
          regex: /(start|begin) investing/i,
          responses: [
            "First-time investor steps: %solution",
            "Getting started: %solution",
            "Beginner strategies: %solution"
          ]
        },
        {
          regex: /(retirement|401k|IRA)/i,
          responses: [
            "Retirement planning: %solution",
            "Long-term strategies: %solution",
            "Tax-advantaged accounts: %solution"
          ]
        }
      ],
      
      solutions: [
        "diversify across asset classes",
        "low-cost index fund investing",
        "dollar-cost averaging approach",
        "maximize employer 401k matching",
        "rebalance portfolio annually"
      ],
      
      riskProfiles: {
        "conservative": "70% bonds, 30% stocks",
        "moderate": "50% bonds, 50% stocks",
        "aggressive": "20% bonds, 80% stocks"
      },
      
      updateProfile: (input, profile) => {
        const updates = {};
        
        if (input.match(/retirement|401k|IRA/i)) {
          updates.investingGoal = "retirement";
        } else if (input.match(/growth|wealth/i)) {
          updates.investingGoal = "growth";
        }
        
        if (input.match(/low risk|conservative/i)) {
          updates.riskTolerance = "conservative";
        } else if (input.match(/high risk|aggressive/i)) {
          updates.riskTolerance = "aggressive";
        }
        
        return updates;
      }
    });
  }

  getSolution(input, context) {
    // Provide risk-appropriate advice
    if (context.userProfile?.riskTolerance) {
      return `${this.config.solutions[0]} (${this.config.riskProfiles[context.userProfile.riskTolerance]})`;
    }
    
    // Retirement-specific advice
    if (context.userProfile?.investingGoal === "retirement") {
      return "focus on tax-advantaged accounts first";
    }
    
    return super.getSolution(input, context);
  }
}

module.exports = InvestingTopic;