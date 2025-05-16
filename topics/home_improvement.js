const { Topic } = require('../core/Topic');

class HomeImprovementTopic extends Topic {
  constructor() {
    super({
      name: "home_improvement",
      description: "Provides guidance on home repairs and DIY projects",
      keywords: ["home", "repair", "renovation", "DIY", "fix", "install"],
      
      patterns: [
        {
          regex: /(fix|repair) (.*?)(leak|pipe|faucet)/i,
          responses: [
            "For %2%3 issues: %solution",
            "Plumbing solutions: %solution",
            "Try this repair approach: %solution"
          ]
        },
        {
          regex: /install (.*?)(shelf|light|tile)/i,
          responses: [
            "%1%2 installation tips: %solution",
            "Proper installation requires: %solution",
            "Key steps: %solution"
          ]
        }
      ],
      
      solutions: [
        "turn off water/power before starting",
        "use proper safety equipment",
        "watch tutorial videos for your specific model",
        "measure twice, cut once",
        "have all tools ready before beginning"
      ],
      
      difficultyLevels: {
        "beginner": ["picture hanging", "caulking", "furniture assembly"],
        "intermediate": ["faucet replacement", "tile backsplash", "shelf installation"],
        "advanced": ["electrical work", "plumbing rough-in", "structural changes"]
      },
      
      toolRecommendations: {
        "basic": ["hammer", "screwdrivers", "measuring tape", "level"],
        "plumbing": ["pipe wrench", "plumber's tape", "tubing cutter"]
      }
    });
  }

  getSolution(input, context) {
    // Match project difficulty
    for (const [level, projects] of Object.entries(this.config.difficultyLevels)) {
      if (projects.some(project => input.includes(project))) {
        return `This is a ${level}-level project. ${this.config.solutions[0]}`;
      }
    }
    
    // Recommend tools if mentioned
    const toolMatch = input.match(/plumb|pipe|faucet/i) ? 'plumbing' : 'basic';
    if (Math.random() > 0.7) { // 30% chance to add tool tip
      return `${super.getSolution(input, context)}. You'll need: ${this.config.toolRecommendations[toolMatch].join(', ')}`;
    }
    
    return super.getSolution(input, context);
  }
}

module.exports = HomeImprovementTopic;