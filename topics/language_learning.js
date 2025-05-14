const BaseTopic = require('../core/Topic');

class LanguageLearningTopic extends BaseTopic {
  constructor() {
    super({
      name: "language_learning",
      description: "Provides techniques for learning foreign languages",
      keywords: ["language", "learn", "fluent", "vocabulary", "grammar", "pronounce"],
      
      patterns: [
        {
          regex: /(learn|study) (.*?)(Spanish|French|Japanese)/i,
          responses: [
            "%3 acquisition strategies: %solution",
            "%3 learning methods: %solution",
            "Effective approaches: %solution"
          ]
        },
        {
          regex: /(remember|retain) vocabulary/i,
          responses: [
            "Vocabulary retention: %solution",
            "Memorization techniques: %solution",
            "Try this recall method: %solution"
          ]
        }
      ],
      
      solutions: [
        "spaced repetition with Anki flashcards",
        "comprehensible input method",
        "language parent concept",
        "shadowing technique",
        "TPR (Total Physical Response)"
      ],
      
      languageSpecific: {
        "Spanish": ["focus on verb conjugations early", "gender agreement patterns"],
        "Japanese": ["master hiragana first", "particle usage drills"]
      },
      
      resourceFinder: (language) => ({
        "podcasts": `LanguagePod101 ${language}`,
        "apps": `Duolingo ${language} course`,
        "exchange": `Tandem ${language} partners`
      })
    });
  }

  generateResponse(input, matchResult, context) {
    // Add language-specific resources
    const langMatch = input.match(/Spanish|French|Japanese|German/i);
    if (langMatch) {
      const language = langMatch[0];
      const resources = this.config.resourceFinder(language);
      return {
        response: `${super.generateResponse(input, matchResult, context).response}\n\n${language} resources:\n- Podcast: ${resources.podcasts}\n- App: ${resources.apps}`,
        topic: this.name
      };
    }
    
    return super.generateResponse(input, matchResult, context);
  }
}

module.exports = LanguageLearningTopic;