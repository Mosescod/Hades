module.exports = {
  name: "time_management",
  description: "Handles scheduling and productivity challenges",
  keywords: ["time", "busy", "schedule", "productive", "balance"],
  
  patterns: [
    {
      regex: /(no|not enough) time/i,
      responses: [
        "Time constraints are challenging. %solution",
        "When pressed for time: %solution",
        "Try this time strategy: %solution"
      ]
    },
    {
      regex: /(balance|juggle).*(work|life)/i,
      responses: [
        "Work-life balance is crucial. %solution",
        "For better balance: %solution",
        "Many find this helpful: %solution"
      ]
    },
    {
      regex: /(schedule|plan).*(tournament|competition)/i,
      responses: [
        "Event preparation requires planning. %solution",
        "For competition scheduling: %solution",
        "Athletes often use: %solution"
      ]
    }
  ],
  
  solutions: [
    "time blocking technique",
    "priority matrix (urgent/important)",
    "weekly review sessions",
    "delegation strategies",
    "digital detox periods",
    "buffer time between activities"
  ],

  crossTopicHandlers: {
    "sports_performance": (input, context) => {
      if (input.match(/(time|schedule).*(train|practice)/i)) {
        return {
          response: "Balancing training with other commitments? Try:\n" +
                   "1. High-intensity shorter workouts\n" +
                   "2. Combining activities (e.g., bike commuting)\n" +
                   "3. Periodization planning",
          solutions: [
            "HIIT training protocols",
            "active transportation",
            "seasonal training cycles"
          ]
        };
      }
      return null;
    }
  }
};