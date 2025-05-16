const { Topic } = require('../core/Topic');

class MentalHealthTopic extends Topic {
  constructor() {
    super({
      name: "mental_health",
      description: "Provides emotional support and mental health resources",
      keywords: ["depressed", "anxious", "stress", "overwhelmed", "therapy", "counseling"],
      sentimentBias: -0.7, // Triggers more on negative sentiment
      
      patterns: [
        {
          regex: /(feel|feeling) (depressed|down|sad|hopeless)/i,
          responses: [
            "I hear you're feeling %2. %solution",
            "What you're experiencing sounds difficult. %solution",
            "Many people find help with: %solution"
          ]
        },
        {
          regex: /(anxiety|anxious|panic)/i,
          responses: [
            "Anxiety can feel overwhelming. %solution",
            "When anxiety strikes: %solution",
            "Try this calming technique: %solution"
          ]
        }
      ],
      
      solutions: [
        "box breathing technique (4-4-4-4)",
        "5-4-3-2-1 grounding exercise",
        "scheduling a therapist appointment",
        "calling a crisis hotline",
        "going for a mindful walk"
      ],
      
      solutionExplanations: {
        "box breathing technique": "Breathe in for 4 seconds, hold for 4, exhale for 4, wait for 4. Repeat 5 times.",
        "5-4-3-2-1 grounding": "Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste."
      },
      
      emergencyProtocol: (input) => {
        if (input.match(/(end it all|suicide|kill myself)/i)) {
          return {
            response: "I'm very concerned about what you're saying. " +
                     "Please call the National Suicide Prevention Lifeline at 988 " +
                     "or text HOME to 741741. You're not alone.",
            immediate: true
          };
        }
        return null;
      }
    });
  }

  generateResponse(input, matchResult, context) {
    // Check emergency first
    const emergency = this.config.emergencyProtocol(input);
    if (emergency) return emergency;

    // Then proceed normally
    return super.generateResponse(input, matchResult, context);
  }
}

module.exports = MentalHealthTopic;