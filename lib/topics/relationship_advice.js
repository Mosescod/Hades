const { Topic } = require('../core/Topic');

class RelationshipTopic extends Topic {
  constructor() {
    super({
      name: "relationship_advice",
      description: "Provides guidance on interpersonal relationships and communication",
      keywords: ["relationship", "partner", "dating", "breakup", "argument", "communication"],
      
      patterns: [
        {
          regex: /(fight|argument) with (partner|boyfriend|girlfriend|spouse)/i,
          responses: [
            "Conflict resolution strategies: %solution",
            "After an argument: %solution",
            "Healthy approaches: %solution"
          ],
          transform: (response, input) => {
            const relMatch = input.match(/(partner|boyfriend|girlfriend|spouse)/i);
            return relMatch ? response.replace('%2', relMatch[0]) : response;
          }
        },
        {
          regex: /breakup|broken heart/i,
          responses: [
            "Healing after a breakup: %solution",
            "Post-breakup coping: %solution",
            "Self-care strategies: %solution"
          ]
        }
      ],
      
      solutions: [
        "active listening techniques",
        "'I feel' statements instead of blame",
        "scheduled check-in conversations",
        "30-day no contact rule after breakups",
        "journaling to process emotions"
      ],
      
      communicationFrameworks: {
        "nonviolent": "Observe, Feel, Need, Request framework",
        "gottman": "Soft startup, repair attempts, accept influence"
      },
      
      crisisResources: {
        "domestic": "National Domestic Violence Hotline: 1-800-799-7233",
        "lgbtq": "Trevor Project: 1-866-488-7386"
      }
    });
  }

  generateResponse(input, matchResult, context) {
    // Check for crisis situations
    if (input.match(/abuse|violence|unsafe/i)) {
      const crisisType = input.match(/domestic|lgbtq/i)?.[0]?.toLowerCase() || 'domestic';
      return {
        response: `Your safety is most important. Please contact: ${this.config.crisisResources[crisisType]}`,
        immediate: true,
        topic: this.name
      };
    }
    
    // Add communication framework if relevant
    if (input.match(/communicat|talk|discuss/i)) {
      const framework = Math.random() > 0.5 ? 'nonviolent' : 'gottman';
      return {
        response: `${super.generateResponse(input, matchResult, context).response}\n\nConsider the ${framework} communication framework: ${this.config.communicationFrameworks[framework]}`,
        topic: this.name
      };
    }
    
    return super.generateResponse(input, matchResult, context);
  }
}

module.exports = RelationshipTopic;