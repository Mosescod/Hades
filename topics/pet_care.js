const BaseTopic = require('../core/Topic');

class PetCareTopic extends BaseTopic {
  constructor() {
    super({
      name: "pet_care",
      description: "Provides advice on pet health and training",
      keywords: ["pet", "dog", "cat", "vet", "train", "feed"],
      
      patterns: [
        {
          regex: /(train|teach) (.*?)(dog|puppy)/i,
          responses: [
            "%2%3 training techniques: %solution",
            "Effective training methods: %solution",
            "Positive reinforcement approach: %solution"
          ]
        },
        {
          regex: /(cat|dog) (not eating|vomit|diarrhea)/i,
          responses: [
            "When your %1 has %2: %solution",
            "%1 health concern solutions: %solution",
            "Veterinary advice: %solution"
          ]
        }
      ],
      
      solutions: [
        "positive reinforcement with treats",
        "consistent daily routine",
        "immediate vet visit for serious symptoms",
        "gradual food transitions",
        "environmental enrichment activities"
      ],
      
      emergencySymptoms: [
        "difficulty breathing",
        "seizures",
        "unconsciousness",
        "bloated abdomen",
        "trauma injuries"
      ],
      
      speciesSpecific: {
        "dog": {
          "training": "5-10 minute sessions, 3x daily",
          "diet": "Avoid chocolate, grapes, onions"
        },
        "cat": {
          "training": "Clicker training works well",
          "diet": "Plenty of fresh water, avoid milk"
        }
      }
    });
  }

  generateResponse(input, matchResult, context) {
    // Check for emergencies
    const isEmergency = this.config.emergencySymptoms.some(symptom => 
      input.includes(symptom)
    );
    
    if (isEmergency) {
      return {
        response: "This sounds serious! Please contact your vet or emergency animal hospital immediately.",
        immediate: true,
        topic: this.name
      };
    }
    
    // Add species-specific advice
    const speciesMatch = input.match(/dog|cat|bird|rabbit/i);
    if (speciesMatch) {
      const species = speciesMatch[0].toLowerCase();
      if (this.config.speciesSpecific[species]) {
        const concern = input.match(/train|diet|health/i)?.[0]?.toLowerCase() || 'training';
        const advice = this.config.speciesSpecific[species][concern] || 
                      this.config.speciesSpecific[species]['training'];
        
        return {
          response: `For ${species}: ${advice}. Also: ${super.generateResponse(input, matchResult, context).response}`,
          topic: this.name
        };
      }
    }
    
    return super.generateResponse(input, matchResult, context);
  }
}

module.exports = PetCareTopic;