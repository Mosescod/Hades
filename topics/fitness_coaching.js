const BaseTopic = require('../core/Topic');

class FitnessTopic extends BaseTopic {
  constructor() {
    super({
      name: "fitness_coaching",
      description: "Provides exercise and workout guidance",
      keywords: ["exercise", "workout", "gym", "cardio", "strength", "fit"],
      
      patterns: [
        {
          regex: /(lose|burn) fat/i,
          responses: [
            "Effective fat loss combines: %solution",
            "For fat burning: %solution",
            "Try this approach: %solution"
          ]
        },
        {
          regex: /build (muscle|strength)/i,
          responses: [
            "Muscle growth requires: %solution",
            "For strength gains: %solution",
            "Key principles: %solution"
          ]
        }
      ],
      
      solutions: [
        "progressive overload in workouts",
        "compound movements 3x/week",
        "HIIT 2-3x/week for cardio",
        "protein intake 1g/lb bodyweight",
        "7-9 hours sleep nightly"
      ],
      
      solutionExplanations: {
        "progressive overload": "Gradually increase weight, reps, or intensity weekly",
        "HIIT": "High Intensity Interval Training: 20-30s max effort, 60-90s rest"
      },
      
      updateProfile: (input, profile) => {
        const updates = {};
        
        // Detect fitness level
        if (input.match(/beginner|new to|starting/i)) {
          updates.fitnessLevel = "beginner";
        } else if (input.match(/intermediate|some experience/i)) {
          updates.fitnessLevel = "intermediate";
        } else if (input.match(/advanced|expert|years/i)) {
          updates.fitnessLevel = "advanced";
        }
        
        // Detect goals
        if (input.match(/lose fat|lean out|cutting/i)) {
          updates.fitnessGoal = "fat loss";
        } else if (input.match(/build muscle|bulk/i)) {
          updates.fitnessGoal = "muscle gain";
        }
        
        return updates;
      }
    });
  }

  getSolution(input, context) {
    // Adapt solutions based on user profile
    if (context.userProfile?.fitnessLevel === "beginner") {
      return "start with bodyweight exercises 3x/week";
    }
    return super.getSolution(input, context);
  }
}

module.exports = FitnessTopic;