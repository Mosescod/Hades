const BaseTopic = require('../core/Topic');

class CarMaintenanceTopic extends BaseTopic {
  constructor() {
    super({
      name: "car_maintenance",
      description: "Provides vehicle maintenance and repair advice",
      keywords: ["car", "truck", "engine", "oil", "tire", "repair"],
      
      patterns: [
        {
          regex: /(change|replace) (.*?)(oil|tire|battery)/i,
          responses: [
            "%2%3 replacement steps: %solution",
            "Proper maintenance: %solution",
            "DIY guide: %solution"
          ]
        },
        {
          regex: /(car|engine) (noise|sound|knocking)/i,
          responses: [
            "%2 diagnosis: %solution",
            "When you hear %2: %solution",
            "Possible causes: %solution"
          ]
        }
      ],
      
      solutions: [
        "consult owner's manual first",
        "use proper jack stands for safety",
        "regular fluid checks",
        "OBD-II scanner for error codes",
        "professional mechanic for complex issues"
      ],
      
      warningSigns: {
        "knocking": "Possible engine bearing failure",
        "squealing": "Often belts or brakes",
        "smoke": "Immediate attention required"
      },
      
      maintenanceSchedule: {
        "basic": "Oil every 5k miles, tires every 10k",
        "severe": "Oil every 3k, more frequent checks"
      }
    });
  }

  generateResponse(input, matchResult, context) {
    // Add specific warning explanations
    const soundMatch = input.match(/knocking|squealing|grinding/i);
    if (soundMatch) {
      const sound = soundMatch[0].toLowerCase();
      return {
        response: `${this.config.warningSigns[sound]}. ${super.generateResponse(input, matchResult, context).response}`,
        topic: this.name
      };
    }
    
    // Add maintenance schedule if relevant
    if (input.match(/how often|schedule|interval/i)) {
      const driveType = input.match(/severe|extreme/i) ? 'severe' : 'basic';
      return {
        response: `For ${driveType} conditions: ${this.config.maintenanceSchedule[driveType]}. ${this.config.solutions[0]}`,
        topic: this.name
      };
    }
    
    return super.generateResponse(input, matchResult, context);
  }
}

module.exports = CarMaintenanceTopic;