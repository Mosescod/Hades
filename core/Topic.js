const natural = require('natural');

class Topic {
  constructor(config = {}) {
    if (!config.name) throw new Error('Topic must have a name');
    
    this.name = config.name;
    this.description = config.description || '';
    this.keywords = config.keywords || [];
    this.patterns = config.patterns || [];
    this.solutions = config.solutions || [];
    this.solutionExplanations = config.solutionExplanations || {};
    this.deepKnowledge = config.deepKnowledge || {};
    this.crossTopicHandlers = config.crossTopicHandlers || {};
    this.dependencies = config.dependencies || [];
    
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
  }

  // Improved pattern matching with scoring
  match(input, context = {}) {
    let score = 0;
    const inputLower = input.toLowerCase();
    
    // Keyword matching
    score += this.keywords.filter(kw => 
      inputLower.includes(kw.toLowerCase())
    ).length * 0.5;

    // Pattern matching
    const matchedPattern = this.patterns.find(p => 
      new RegExp(p.regex, 'i').test(input)
    );
    if (matchedPattern) score += 2;

    // Context awareness
    if (context.activeTopics?.includes(this.name)) {
      score += 1;
    }

    return {
      score,
      pattern: matchedPattern,
      topic: this
    };
  }

  generateResponse(input, matchResult, context) {
    if (!matchResult.pattern) return null;
    
    const responses = matchResult.pattern.responses || 
                     this.defaultResponses || 
                     [`Tell me more about ${this.name.replace('_', ' ')}.`];
    
    let response = responses[Math.floor(Math.random() * responses.length)];
    
    // Handle solution placeholders
    if (response.includes('%solution') && this.solutions.length) {
      const solution = this.getSolution(input, context);
      response = response.replace('%solution', solution);
    }
    
    return response;
  }

  getSolution(input, context) {
    // Simple random selection by default
    return this.solutions[Math.floor(Math.random() * this.solutions.length)];
  }

  updateProfile(input, profile) {
    // Default implementation - can be overridden
    return {};
  }
}

module.exports = Topic;