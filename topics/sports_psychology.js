module.exports = {
  name: "sports_psychology",
  description: "Handles mental aspects of sports performance",
  keywords: ["mental", "focus", "pressure", "anxiety", "confidence", "mindset"],
  
  patterns: [
    {
      regex: /(mental|focus).*(problem|issue|difficult)/i,
      responses: [
        "Mental challenges are normal. %solution",
        "For focus issues: %solution",
        "Many athletes improve with: %solution"
      ]
    },
    {
      regex: /(pressure|stress|nervous).*(competition|game)/i,
      responses: [
        "Pre-competition nerves are common. %solution",
        "To manage pressure: %solution",
        "Try this before events: %solution"
      ]
    },
    {
      regex: /(confiden|believe).*(low|lack)/i,
      responses: [
        "Confidence can be built. %solution",
        "For self-belief: %solution",
        "Try this confidence booster: %solution"
      ]
    }
  ],
  
  solutions: [
    "pre-performance routines",
    "controlled breathing exercises",
    "process-focused goal setting",
    "positive self-talk practice",
    "visualization techniques",
    "mindfulness meditation"
  ],

  solutionExplanations: {
    "visualization techniques": "Mentally rehearse perfect performance in vivid detail for 10 minutes daily.",
    "process-focused goals": "Set goals about execution (e.g., 'follow through on shots') rather than outcomes."
  },

  crossTopicHandlers: {
    "personal_finance": (input, context) => {
      if (input.match(/(money|finance).*(mental|focus|confidence)/i)) {
        return {
          response: "Financial stress can indeed affect mental performance. Try:\n" +
                   "1. Separating money worries from training time\n" +
                   "2. Financial mindfulness exercises\n" +
                   "3. Process-focused training to shift focus",
          solutions: [
            "5-minute pre-training mental transitions",
            "gratitude journaling for non-financial positives",
            "performance process goals"
          ]
        };
      }
      return null;
    }
  }
};