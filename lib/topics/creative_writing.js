const { Topic } = require('../core/Topic');

class CreativeWritingTopic extends Topic {
  constructor() {
    super({
      name: "creative_writing",
      description: "Provides storytelling techniques and writer's block solutions",
      keywords: ["write", "story", "character", "plot", "block", "poem"],
      
      patterns: [
        {
          regex: /(develop|create) (character|world)/i,
          responses: [
            "%2 development techniques: %solution",
            "Compelling %2 creation: %solution",
            "Try this %2 exercise: %solution"
          ]
        },
        {
          regex: /(writer'?s block|stuck)/i,
          responses: [
            "Overcoming blocks: %solution",
            "Creativity boosters: %solution",
            "Try this unblocking method: %solution"
          ]
        }
      ],
      
      solutions: [
        "interview your characters with 20 questions",
        "freewriting sessions (no editing for 15 mins)",
        "story dice for random prompts",
        "emotional wound backstory template",
        "five senses immersion exercise"
      ],
      
      genreSpecific: {
        "fantasy": ["magic system rules", "culture clash themes"],
        "mystery": ["clue placement timeline", "red herring techniques"]
      },
      
      promptGenerator: () => {
        const characters = ["retired astronaut", "child prodigy", "sentient robot"];
        const conflicts = ["discovers a hidden family secret", "must smuggle a rare artifact"];
        return `${characters[Math.floor(Math.random() * characters.length)]} ${conflicts[Math.floor(Math.random() * conflicts.length)]}`;
      }
    });
  }

  generateResponse(input, matchResult, context) {
    // Generate writing prompt for block queries
    if (input.match(/block|stuck|idea/i)) {
      return {
        response: `${super.generateResponse(input, matchResult, context).response}\n\nTry this prompt: "${this.config.promptGenerator()}"`,
        topic: this.name
      };
    }
    
    // Add genre-specific advice
    const genreMatch = input.match(/fantasy|mystery|scifi|romance/i);
    if (genreMatch) {
      const genre = genreMatch[0].toLowerCase();
      return {
        response: `${super.generateResponse(input, matchResult, context).response}\n\n${genre} focus: ${this.config.genreSpecific[genre]?.[0] || 'three-act structure'}`,
        topic: this.name
      };
    }
    
    return super.generateResponse(input, matchResult, context);
  }
}

module.exports = CreativeWritingTopic;