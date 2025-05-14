const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const natural = require('natural');
const Topic = require('./Topic');
const config = require('../config');
const { MemoryManager } = require('../utils/memory');
const { NLProcessor } = require('../utils/nlp');

class HadesAgent {
  constructor() {
    this.config = config;
    this.topics = new Map();
    this.nlp = new NLProcessor(config.nlp);
    this.memory = new MemoryManager(config.memory);
    this.state = {
      current: 'initial',
      previous: null,
      context: {
        activeTopics: [],
        userProfile: {},
        emotionalState: 0
      }
    };
    
    this.loadTopics();
    this.setupFallbacks();
    this.setupActions();
  }

  async loadTopics() {
    const topicsDir = path.join(__dirname, '../topics');
    
    // Load in dependency order
    const topicFiles = fs.readdirSync(topicsDir)
      .filter(file => file.endsWith('.js'))
      .map(file => {
        const topic = require(path.join(topicsDir, file));
        return { file, topic, dependencies: topic.dependencies || [] };
      });

    // Simple dependency sorting
    const loaded = new Set();
    let changed = true;
    
    while (changed && topicFiles.length > 0) {
      changed = false;
      
      for (let i = 0; i < topicFiles.length; i++) {
        const { file, topic, dependencies } = topicFiles[i];
        
        if (dependencies.every(dep => loaded.has(dep))) {
          try {
            const topicInstance = new Topic(topic);
            this.topics.set(topic.name, topicInstance);
            loaded.add(topic.name);
            topicFiles.splice(i, 1);
            i--;
            changed = true;
            console.log(chalk.green(`✓ Loaded topic: ${topic.name}`));
          } catch (err) {
            console.error(chalk.red(`× Error loading ${file}:`), err.message);
          }
        }
      }
    }
  }

  setupFallbacks() {
    this.fallbacks = {
      general: [
        "I'd like to understand more about that. Could you elaborate?",
        "What does that mean to you?",
        "How does that make you feel?"
      ],
      clarification: [
        "Could you explain what specifically you'd like to know?",
        "Which part should I clarify?",
        "What aspect are you most curious about?"
      ]
    };
  }

  setupActions() {
    this.actions = {
      'help': {
        pattern: /^help$/i,
        execute: () => this.getHelpResponse()
      },
      'exit': {
        pattern: /^exit$/i,
        execute: () => ({ response: "Goodbye!", exit: true })
      }
    };
  }

  async processInput(input) {
    // Preprocess and analyze input
    const processed = await this.nlp.process(input);
    this.memory.store('shortTerm', { 
      input: processed.text, 
      analysis: processed 
    });

    // Check for actions first
    const actionResponse = this.checkActions(processed.text);
    if (actionResponse) return actionResponse;

    // Get best matching topic
    const topicMatch = await this.findBestTopicMatch(processed.text);
    
    // Generate response
    const response = await this.generateResponse(
      processed.text, 
      topicMatch, 
      processed
    );

    // Update state and memory
    this.updateState(processed.text, response, topicMatch);
    
    return response;
  }

  async findBestTopicMatch(input) {
    let bestMatch = { score: 0, topic: null };
    
    // Check cross-topic handlers first
    for (const topicName of this.state.context.activeTopics) {
      const topic = this.topics.get(topicName);
      if (!topic) continue;
      
      for (const [otherTopic, handler] of Object.entries(topic.crossTopicHandlers)) {
        const response = handler(input, this.state.context);
        if (response) {
          const targetTopic = this.topics.get(otherTopic);
          if (targetTopic) {
            return {
              score: 3, // High score for cross-topic
              topic: targetTopic,
              forcedResponse: response
            };
          }
        }
      }
    }

    // Check all topics
    for (const [name, topic] of this.topics) {
      const match = topic.match(input, this.state.context);
      if (match.score > bestMatch.score) {
        bestMatch = match;
      }
    }

    return bestMatch;
  }

  async generateResponse(input, matchResult, nlpAnalysis) {
    // Handle forced responses (from cross-topic)
    if (matchResult.forcedResponse) {
      return {
        response: matchResult.forcedResponse.response,
        topic: matchResult.topic.name,
        solutions: matchResult.forcedResponse.solutions,
        metadata: {
          type: 'cross-topic',
          source: this.state.context.activeTopics
        }
      };
    }

    // Handle no topic match
    if (!matchResult.topic || matchResult.score < 1.5) {
      return {
        response: this.getFallback('general'),
        topic: 'general',
        metadata: { type: 'fallback' }
      };
    }

    // Generate topic response
    const response = matchResult.topic.generateResponse(
      input, 
      matchResult, 
      this.state.context
    );

    // Add emotional tone if needed
    if (nlpAnalysis.sentiment < -0.5) {
      response.response = this.addEmpathy(response.response);
    }

    return {
      ...response,
      topic: matchResult.topic.name,
      metadata: {
        type: 'topic-response',
        score: matchResult.score,
        pattern: matchResult.pattern?.regex?.toString()
      }
    };
  }

  updateState(input, response, topicMatch) {
    // Update active topics
    if (topicMatch?.topic?.name && 
        !this.state.context.activeTopics.includes(topicMatch.topic.name)) {
      this.state.context.activeTopics.unshift(topicMatch.topic.name);
      if (this.state.context.activeTopics.length > this.config.conversation.maxTopicsActive) {
        this.state.context.activeTopics.pop();
      }
    }

    // Update emotional state
    this.state.context.emotionalState = 
      this.memory.getRecentSentimentAverage(3) || 0;

    // Update user profile if topic provides handler
    if (topicMatch?.topic?.updateProfile) {
      this.state.context.userProfile = {
        ...this.state.context.userProfile,
        ...topicMatch.topic.updateProfile(input, this.state.context.userProfile)
      };
    }
  }

  // ... (other helper methods)
}

module.exports = HadesAgent;