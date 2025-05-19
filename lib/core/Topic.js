const natural = require('natural');

class Topic {
  constructor(config = {}) {
    // Validate required properties
    if (typeof config.name !== 'string' || !config.name.trim()) {
      throw new Error('Topic name must be a non-empty string');
    }
    
    if (!config.name || typeof config.name !== 'string') {
      throw new Error('Topic name must be a non-empty string');
    }

    // Core properties
    this.name = config.name;
    this.description = config.description || '';
    this.keywords = config.keywords || [];
    this.priority = config.priority || 1;
    
    // Conversation patterns
    this.patterns = config.patterns || [];
    this.solutions = config.solutions || [];
    this.solutionExplanations = config.solutionExplanations || {};
    
    // Cross-topic integration
    this.crossTopicHandlers = config.crossTopicHandlers || {};
    this.dependencies = config.dependencies || [];
    this.relatedTopics = config.relatedTopics || [];
    
    // Memory and personalization
    this.profileExtractors = config.profileExtractors || [];
    this.memoryTriggers = config.memoryTriggers || [];
    
    // NLP tools
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;

    // Debugging
    this.debug = config.debug || false;
  }

  // Enhanced pattern matching with cross-topic awareness
  match(input, context = {}) {
    let score = 0;
    const inputLower = input.toLowerCase();
    
    // 1. Keyword matching with stemming
    this.keywords.forEach(keyword => {
        const stemmedKeyword = this.stemmer.stem(keyword);
        if (inputLower.includes(keyword) || 
            inputLower.includes(stemmedKeyword)) {
            score += 0.75; // Increased from 0.5
        }
    });

    // 2. Pattern matching
    this.patterns.forEach(pattern => {
        const regex = new RegExp(pattern.regex, 'i');
        if (regex.test(input)) {
            score += 2.0; // Strong match
            return { score, pattern, topic: this };
        }
    });

    // 3. Context bonus
    if (context.activeTopics?.includes(this.name)) {
        score += 1.0;
    }

    return { score, topic: this };
  }

  logMatchDetails(input, matchResult) {
    console.log(`[Topic Match] ${this.name}`);
    console.log(`Input: "${input}"`);
    console.log(`Score: ${matchResult.score.toFixed(2)}`);
    console.log(`Pattern: ${matchResult.pattern?.regex?.toString() || 'none'}`);
    console.log('---');
  }

  // Integrated response generation
  generateResponse(input, matchResult, context = {}, allTopics = []) {
    // Check cross-topic handlers first
    for (const [topicName, handler] of Object.entries(this.crossTopicHandlers)) {
      const crossResponse = handler(input, context);
      if (crossResponse) {
        return {
          ...crossResponse,
          crossTopic: true,
          sourceTopic: this.name,
          targetTopic: topicName,
          topic: this.name
        };
      }
    }

    // Generate base response
    const baseResponse = this._generateBaseResponse(input, matchResult, context);
    if (!baseResponse) return null;

    const response = {
      response: baseResponse,
      topic: this.name,
      metadata: {
        score: matchResult.score,
        matchedPattern: matchResult.pattern?.regex?.toString()
      }
    };

    // Add related topic suggestions
    if (this.relatedTopics.length > 0 && Math.random() > 0.6) {
      const related = this.relatedTopics
        .map(name => allTopics.find(t => t.name === name))
        .filter(t => t);
      
      if (related.length > 0) {
        response.response += `\n\nRelated topics: ${related.map(t => t.name).join(', ')}`;
        response.metadata.relatedTopics = related.map(t => t.name);
      }
    }

    return response;
  }

  _generateBaseResponse(input, matchResult, context) {
    if (!matchResult?.pattern) {
      return this.defaultResponse || `Tell me more about ${this.name.replace('_', ' ')}.`;
    }
    
    const responses = matchResult.pattern.responses || 
                     this.defaultResponses || 
                     [`Tell me more about ${this.name.replace('_', ' ')}.`];
    
    let response = responses[Math.floor(Math.random() * responses.length)];
    
    // Handle solution placeholders
    if (response.includes('%solution') && this.solutions.length) {
      const solution = this._getSolution(input, context);
      response = response.replace('%solution', solution);
    }
    
    // Handle numbered replacements (%1, %2, etc.)
    if (matchResult.pattern.regex && response.match(/%\d+/)) {
      const matches = input.match(new RegExp(matchResult.pattern.regex, 'i'));
      if (matches) {
        response = response.replace(/%(\d+)/g, (_, num) => {
          return matches[parseInt(num)] || '';
        });
      }
    }
    
    return response;
  }

  _getSolution(input, context) {
    if (!this.solutions.length) return "consider possible solutions";
    
    // Simple random selection - can be enhanced with context-aware selection
    return this.solutions[Math.floor(Math.random() * this.solutions.length)];
  }

  // Profile extraction with memory integration
  extractProfileInfo(input, currentProfile = {}) {
    const updates = {};
    
    // Run all profile extractors
    this.profileExtractors.forEach(extractor => {
      Object.assign(updates, extractor(input, currentProfile));
    });

    // Default extractors if none provided
    if (!this.profileExtractors.length) {
      const amountMatch = input.match(/\$?(\d{3,})/);
      if (amountMatch) {
        updates.incomeRange = parseInt(amountMatch[1]) > 2000 ? "medium" : "low";
      }
    }

    return updates;
  }

  // Memory trigger processing
  processMemoryTriggers(input) {
    const memories = [];
    
    this.memoryTriggers.forEach(trigger => {
      if (new RegExp(trigger.pattern, 'i').test(input)) {
        const memory = trigger.store(input);
        if (memory) memories.push(memory);
      }
    });
    
    return memories;
  }
}

module.exports = Topic;
module.exports.Topic = Topic;