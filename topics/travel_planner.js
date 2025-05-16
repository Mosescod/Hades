const { Topic } = require('../core/Topic');

class TravelTopic extends Topic {
  constructor() {
    super({
      name: "travel_planner",
      description: "Assists with travel planning and recommendations",
      keywords: ["travel", "trip", "vacation", "flight", "hotel", "itinerary"],
      
      patterns: [
        {
          regex: /plan (trip|vacation)/i,
          responses: [
            "Trip planning steps: %solution",
            "For great vacations: %solution",
            "Consider this approach: %solution"
          ]
        },
        {
          regex: /(cheap|affordable) travel/i,
          responses: [
            "Budget travel tips: %solution",
            "Save money by: %solution",
            "Try these cost-cutters: %solution"
          ]
        }
      ],
      
      solutions: [
        "book flights 6-8 weeks in advance",
        "travel shoulder season",
        "use fare comparison tools",
        "pack carry-on only",
        "stay in local neighborhoods"
      ],
      
      destinationTips: {
        "europe": "Get rail pass for multi-country trips",
        "asia": "Street food is delicious and affordable"
      },
      
      updateProfile: (input, profile) => {
        const updates = {};
        const budgetMatch = input.match(/(\$\d+) budget/i);
        if (budgetMatch) updates.travelBudget = budgetMatch[1];
        
        const peopleMatch = input.match(/(family|couple|solo)/i);
        if (peopleMatch) updates.travelGroup = peopleMatch[0].toLowerCase();
        
        return updates;
      }
    });
  }

  getSolution(input, context) {
    // Provide destination-specific advice
    const destinationMatch = input.match(/europe|asia|latin america/i);
    if (destinationMatch) {
      const dest = destinationMatch[0].toLowerCase();
      if (this.config.destinationTips[dest]) {
        return `${this.config.solutions[0]}. Also: ${this.config.destinationTips[dest]}`;
      }
    }
    
    // Adapt for budget constraints
    if (context.userProfile?.travelBudget) {
      return "look for hostels and budget airlines";
    }
    
    return super.getSolution(input, context);
  }
}

module.exports = TravelTopic;