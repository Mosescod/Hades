const { Topic } = require('../core/Topic');

class ProductivityTopic extends Topic {
  constructor() {
    super({
      name: "productivity",
      description: "Provides focus enhancement and workflow optimization",
      keywords: ["focus", "productive", "distract", "procrastinat", "flow", "efficient"],
      
      patterns: [
        {
          regex: /(avoid|stop) (distraction|procrastinat)/i,
          responses: [
            "%2 solutions: %solution",
            "Focus techniques: %solution",
            "Try this %2 blocker: %solution"
          ]
        },
        {
          regex: /(deep work|flow state)/i,
          responses: [
            "%1 achievement: %solution",
            "Entering flow: %solution",
            "Optimal conditions: %solution"
          ]
        }
      ],
      
      solutions: [
        "Pomodoro technique with 52/17 intervals",
        "website blocker during focus sessions",
        "pre-commitment device contracts",
        "batching similar tasks",
        "energy level tracking"
      ],
      
      focusPresets: {
        "writer": "90-min blocks with 30-min breaks",
        "coder": "52-min focus, 17-min break",
        "student": "30/5 intervals with review sessions"
      },
      
      distractionAnalysis: (input) => {
        const digital = input.match(/phone|social|email/i) ? "Digital" : "";
        const environmental = input.match(/noise|people|clutter/i) ? "Environmental" : "";
        return [digital, environmental].filter(Boolean).join(" + ") || "Unknown";
      }
    });
  }

  generateResponse(input, matchResult, context) {
    // Add distraction analysis
    if (input.match(/distract|procrastinat/i)) {
      const analysis = this.config.distractionAnalysis(input);
      return {
        response: `${super.generateResponse(input, matchResult, context).response}\n\nDetected distraction type: ${analysis}`,
        topic: this.name
      };
    }
    
    // Add role-specific presets
    const roleMatch = input.match(/writer|coder|student/i);
    if (roleMatch) {
      const role = roleMatch[0].toLowerCase();
      return {
        response: `${super.generateResponse(input, matchResult, context).response}\n\n${role} focus preset: ${this.config.focusPresets[role]}`,
        topic: this.name
      };
    }
    
    return super.generateResponse(input, matchResult, context);
  }
}

module.exports = ProductivityTopic;