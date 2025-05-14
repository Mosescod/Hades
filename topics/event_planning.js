const BaseTopic = require('../core/Topic');

class EventPlanningTopic extends BaseTopic {
  constructor() {
    super({
      name: "event_planning",
      description: "Provides event coordination and logistics guidance",
      keywords: ["event", "party", "wedding", "organize", "venue", "guest"],
      
      patterns: [
        {
          regex: /(plan|organize) (.*?)(wedding|conference)/i,
          responses: [
            "%3 planning checklist: %solution",
            "%3 coordination: %solution",
            "Key considerations: %solution"
          ]
        },
        {
          regex: /(budget|cost).*(event|party)/i,
          responses: [
            "%1 management: %solution",
            "Cost-saving tips: %solution",
            "Financial planning: %solution"
          ]
        }
      ],
      
      solutions: [
        "create master timeline with buffers",
        "vendor comparison spreadsheet",
        "RSVP tracking system",
        "bad weather contingency plan",
        "delegate using responsibility matrix"
      ],
      
      eventTemplates: {
        "wedding": "12-month planning checklist",
        "conference": "Speaker + attendee coordination",
        "birthday": "Theme + activity planning"
      },
      
      budgetCalculator: (type, guests) => {
        const averages = {
          wedding: 100,
          conference: 75,
          birthday: 25
        };
        return averages[type] ? guests * averages[type] : "N/A";
      }
    });
  }

  generateResponse(input, matchResult, context) {
    // Add budget estimates
    const typeMatch = input.match(/wedding|conference|birthday/i);
    const guestMatch = input.match(/\d+\s*guests?/i);
    
    if (typeMatch && guestMatch) {
      const type = typeMatch[0].toLowerCase();
      const guests = parseInt(guestMatch[0]);
      return {
        response: `${super.generateResponse(input, matchResult, context).response}\n\nEstimated budget: ~$${this.config.budgetCalculator(type, guests)} (${guests} guests)`,
        topic: this.name
      };
    }
    
    // Add template for event type
    if (typeMatch) {
      return {
        response: `${super.generateResponse(input, matchResult, context).response}\n\nTemplate: ${this.config.eventTemplates[typeMatch[0].toLowerCase()]}`,
        topic: this.name
      };
    }
    
    return super.generateResponse(input, matchResult, context);
  }
}

module.exports = EventPlanningTopic;