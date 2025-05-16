const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const natural = require('natural');
const Topic = require('./Topic');
const {TopicLoader} = require('./TopicLoader');
const config = require('../config');
const { MemoryManager } = require('../utils/memory');
const { NLProcessor } = require('../utils/nlp');
const { ContextManager } = require('../utils/integration/ContextManager');

class HadesAgent {
  constructor(config = {}) {
    this.config = {
      debug: false,
      topicsDirectory: './topics',
      ...config
    };
    
    // 1. ALWAYS initialize as Map first
    this.topics = new Map(); 
    
    // 2. Initialize TopicLoader
    this.topicLoader = new TopicLoader({ debug: this.config.debug });

    // 3. Safely load topics with error handling
    try {
      const loadedTopics = this.topicLoader.loadTopicsFromDirectory(
        this.config.topicsDirectory
      );
      
      // 4. Ensure we have a valid Map
      if (loadedTopics instanceof Map) {
        this.topics = loadedTopics;
      } else {
        console.warn('TopicLoader did not return a Map, converting results');
        this._convertToMap(loadedTopics);
      }
    } catch (err) {
      console.error('Error loading topics:', err);
      // Maintain empty Map if loading fails
      this.topics = new Map(); 
    }

    // 5. Debug logging
    if (this.config.debug) {
      this._logLoadedTopics();
    }
    
    // Rest of the initialization...
    this.contextManager = new ContextManager();
    this.nlp = new NLProcessor(config.nlp);
    this.memory = new MemoryManager(config.memory || {});
    this.state = {
      current: 'initial',
      previous: null,
      context: {
        activeTopics: [],
        userProfile: {},
        emotionalState: 0
      }
    };

    if (this.config.debug) {
      console.log('Agent initialized with', this.topics.length, 'topics');
    }
    console.log("Loaded topics:", Array.from(this.topics.keys()));
    this.topics.forEach(topic => {
        console.log(`Topic: ${topic.name}`, 
                   `Keywords: ${topic.keywords.join(', ')}`,
                   `Patterns: ${topic.patterns?.length || 0}`);
    });
    
    this.setupFallbacks();
    this.setupActions();
    }


  async loadTopics(dirPath) {
    const topicsDir = path.join(__dirname, '../topics');
    const loadedTopics = this.topicLoader.loadTopicsFromDirectory(dirPath); // Changed to this.topicLoader

    this.topics = new Map();

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
            this.topics.set(topic.name, topicInstance);  // Using Map.set()
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
    return this.topics;
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

  getFallback(type = 'general') {
    if (!this.fallbacks[type]) {
        type = 'general'; // Default to general fallbacks
    }
    
    // Select a random fallback response
    const responses = this.fallbacks[type];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  setupActions() {
    this.actions = {
        'help': {
            pattern: /^(help|commands|what can you do)\b/i,
            execute: () => ({
                response: this.getHelpResponse(),
                topic: 'help',
                metadata: { type: 'action' }
            })
        },
        'exit': {
            pattern: /^(exit|quit|goodbye)\b/i,
            execute: () => ({
                response: "Goodbye! Feel free to return if you have more questions.",
                exit: true,
                topic: 'system',
                metadata: { type: 'action' }
            })
        },
        'topics': {
            pattern: /^(list topics|show topics|topics)\b/i,
            execute: () => ({
                response: `Available topics: ${Array.from(this.topics.keys()).join(', ')}`,
                topic: 'system',
                metadata: { type: 'action' }
            })
        }
    };
  }

  

  async processInput(input) {
    try {
        // Preprocess and analyze input
        const processed = await this.nlp.process(input);
        this.memory.store('shortTerm', { 
            input: processed.text, 
            analysis: processed 
        });

        // Check for actions first (with null check)
        if (this.checkActions) {
            const actionResponse = this.checkActions(processed.text);
            if (actionResponse) return actionResponse;
        }

        // Rest of your existing processInput logic...
        const topicMatch = await this.findBestTopicMatch(processed.text);
        const response = await this.generateResponse(
            processed.text, 
            topicMatch, 
            processed
        );
        this.updateState(processed.text, response, topicMatch);
        return response;

    } catch (err) {
        console.error('Error processing input:', err);
        return {
            response: "I'm having trouble processing that. Could you try again?",
            topic: 'error',
            metadata: { type: 'processing-error' }
        };
    }
  }

  async findBestTopicMatch(input) {
    let bestMatch = { 
        score: 0, 
        topic: null,
        forcedResponse: null,
        pattern: null
    };
    
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
                        score: 3,
                        topic: targetTopic,
                        forcedResponse: response,
                        pattern: null
                    };
                }
            }
        }
    }

    // Check all topics
    for (const [name, topic] of this.topics) {
        const currentMatch = topic.match(input, this.state.context);
        if (currentMatch.score > bestMatch.score) {
            bestMatch = {
                score: currentMatch.score,
                topic: currentMatch.topic,
                forcedResponse: null,
                pattern: currentMatch.pattern
            };
        }
    }

    return bestMatch;
  }

  async generateResponse(input, matchResult, nlpAnalysis) {
    // Ensure matchResult is always an object
    matchResult = matchResult || { 
        score: 0, 
        topic: null, 
        forcedResponse: null,
        pattern: null
    };

    // 1. Handle forced responses first
    if (matchResult.forcedResponse) {
        return {
            response: matchResult.forcedResponse.response,
            topic: matchResult.topic?.name || 'cross-topic',
            solutions: matchResult.forcedResponse.solutions || [],
            metadata: {
                type: 'cross-topic',
                source: this.state.context.activeTopics || []
            }
        };
    }

    // 2. Handle no topic match or low score
    if (!matchResult.topic || matchResult.score < (this.config.minMatchScore || 0.5)) {
        return this.getContextualFallback(input, nlpAnalysis);
    }

    // 3. Generate topic response
    try {
        const response = matchResult.topic.generateResponse(
            input, 
            matchResult, 
            this.state.context
        );

        // Add emotional tone if needed
        if (nlpAnalysis?.sentiment < -0.5) {
            response.response = this.addEmpathy(response.response);
        }

        return {
            ...response,
            topic: matchResult.topic.name,
            metadata: {
                type: 'topic-response',
                score: matchResult.score,
                pattern: matchResult.pattern?.regex?.toString(),
                sentiment: nlpAnalysis?.sentiment
            }
        };
    } catch (err) {
        console.error('Error generating topic response:', err);
        return this.getContextualFallback(input, nlpAnalysis);
    }
}

getContextualFallback(input, nlpAnalysis) {
    // More sophisticated fallback based on input
    const inputLower = input.toLowerCase();
    
    // Emotional fallbacks
    if (nlpAnalysis?.sentiment < -0.3) {
        const emotionalFallbacks = [
            "That sounds difficult. Would you like to talk more about it?",
            "I can hear this is important to you. What should I understand better?",
            "This seems to be affecting you deeply. What would help right now?"
        ];
        return {
            response: emotionalFallbacks[Math.floor(Math.random() * emotionalFallbacks.length)],
            topic: 'emotional-support',
            metadata: { type: 'emotional-fallback' }
        };
    }
    
    // Question fallbacks
    if (inputLower.includes('?')) {
        return {
            response: "That's an interesting question. Let me think about that...",
            topic: 'clarification',
            metadata: { type: 'question-fallback' }
        };
    }
    
    // Short input fallbacks
    if (input.split(/\s+/).length < 4) {
        return {
            response: "Could you say more about that?",
            topic: 'general',
            metadata: { type: 'short-input-fallback' }
        };
    }
    
    // Default fallbacks
    const defaultFallbacks = [
        "I'd like to understand better. Can you explain in different words?",
        "Help me understand what's most important about this.",
        "Let's focus on this. What aspect matters most to you?"
    ];
    
    return {
        response: defaultFallbacks[Math.floor(Math.random() * defaultFallbacks.length)],
        topic: 'general',
        metadata: { type: 'default-fallback' }
    };
  }

  updateState(input, response, topicMatch) {
    // Update active topics
    if (topicMatch?.topic?.name && 
        !this.state.context.activeTopics.includes(topicMatch.topic.name)) {
        this.state.context.activeTopics.unshift(topicMatch.topic.name);
        if (this.state.context.activeTopics.length > this.config.conversation?.maxTopicsActive || 5) {
            this.state.context.activeTopics.pop();
        }
    }

    // Update emotional state using the new method
    this.state.context.emotionalState = this.memory.getRecentSentimentAverage(3) || 0;

    // Update user profile if topic provides handler
    if (topicMatch?.topic?.updateProfile) {
        this.state.context.userProfile = {
            ...this.state.context.userProfile,
            ...topicMatch.topic.updateProfile(input, this.state.context.userProfile)
        };
    }
  }
  checkActions(input) {
        if (!this.actions || Object.keys(this.actions).length === 0) {
            return null;
        }

        for (const [actionName, action] of Object.entries(this.actions)) {
            try {
                if (action.pattern.test(input)) {
                    if (typeof action.execute === 'function') {
                        return action.execute();
                    }
                    return {
                        response: `Action ${actionName} triggered but no handler`,
                        topic: 'system',
                        metadata: { type: 'action' }
                    };
                }
            } catch (err) {
                console.error(`Error checking action ${actionName}:`, err);
            }
        }
        return null;
  }

  addEmpathy(response) {
    const empatheticPhrases = [
        "I can imagine this must be difficult.",
        "This sounds challenging.",
        "I understand this might be hard.",
        "I hear how important this is."
    ];
    
    const randomEmpathy = empatheticPhrases[
        Math.floor(Math.random() * empatheticPhrases.length)
    ];
    
    return `${randomEmpathy} ${response}`;
  }

  getHelpResponse() {
    const actionList = Object.keys(this.actions).map(action => 
        `• ${action}: ${this.actions[action].pattern.toString()}`
    ).join('\n');

    return `I can help with these commands:\n${actionList}\n\n` +
           `You can also talk to me about: ${Array.from(this.topics.keys()).slice(0, 5).join(', ')}...`;
  }
}

module.exports = HadesAgent;