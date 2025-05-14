const BaseTopic = require('../core/Topic');

class PublicSpeakingTopic extends BaseTopic {
  constructor() {
    super({
      name: "public_speaking",
      description: "Provides presentation and communication strategies",
      keywords: ["speech", "presentation", "nervous", "audience", "speak", "pitch"],
      
      patterns: [
        {
          regex: /(fear|nervous|anxious).*(speak|present)/i,
          responses: [
            "Managing %1: %solution",
            "Confidence techniques: %solution",
            "Try this %1 reducer: %solution"
          ]
        },
        {
          regex: /(engage|captivate) audience/i,
          responses: [
            "Audience engagement: %solution",
            "Presentation hooks: %solution",
            "Memorable techniques: %solution"
          ]
        }
      ],
      
      solutions: [
        "power posing for 2 minutes before",
        "structured pause technique",
        "audience Q&A planting",
        "storytelling framework",
        "technical failure contingency plan"
      ],
      
      frameworkTemplates: {
        "PEP": "Point-Example-Point structure",
        "STAR": "Situation-Task-Action-Result narrative",
        "WHAT": "What-How-And-Why-Today presentation flow"
      },
      
      anxietyReducers: [
        "4-7-8 breathing (inhale 4, hold 7, exhale 8)",
        "progressive muscle relaxation",
        "positive visualization rehearsal"
      ]
    });
  }

  getSolution(input, context) {
    // Special handling for anxiety queries
    if (input.match(/nervous|anxious|fear/i)) {
      return this.config.anxietyReducers[
        Math.floor(Math.random() * this.config.anxietyReducers.length)
      ];
    }
    
    // Add presentation frameworks for structure queries
    if (input.match(/structure|framework|outline/i)) {
      const framework = Math.random() > 0.5 ? 'PEP' : 'STAR';
      return `${this.config.solutions[0]}. Use ${framework} framework: ${this.config.frameworkTemplates[framework]}`;
    }
    
    return super.getSolution(input, context);
  }
}

module.exports = PublicSpeakingTopic;