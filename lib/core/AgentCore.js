const https = require('https');
const { URL } = require('url');
const chalk = require('chalk');
const { GroqIntegration } = require('../utils/integration/Groq');
const { OpenAIIntegration } = require('../utils/integration/OpenAI');
const { DeepSeekIntegration } = require('../utils/integration/DeepSeek');
const { HuggingFaceIntegration } = require('../utils/integration/HuggingFace');
const { PerplexityIntegration } = require('../utils/integration/Perplexity');
const { AIMLAPIIntegration } = require('../utils/integration/AIMLAPI');
const { OpenRouterIntegration } = require('../utils/integration/OpenRouter');
const natural = require('natural');
const { MemoryManager } = require('../utils/memory');
const { NLProcessor } = require('../utils/nlp');
require('dotenv').config();

class HadesAgent {
  constructor(config = {}) {
    this.config = {
      debug: process.env.NODE_ENV === 'development',
      minMatchScore: 0.5,
      aiCutoffScore: 0.3,
      maxTopicsActive: 5,
      // Sorted priority for AI providers
      aiPriority: ['openai', 'deepseek', 'perplexity', 'openrouter', 'groq', 'aimlapi', 'huggingface'],
      aiRetryAttempts: 2,
      ...config
    };
    this._initializeAIIntegrations(config);

    // In-memory topics
    this.topics = new Map([
      ['general', {
        name: 'general',
        patterns: [/.*/],
        generateResponse: (input) => ({
          response: "I'm not sure how to respond to that.",
          topic: 'general'
        })
      }],
      ['help', {
        name: 'help',
        patterns: [/help/i, /support/i],
        generateResponse: () => ({
          response: "I can help with general questions. Try asking me something specific.",
          topic: 'help'
        })
      }]
    ]);

    try {
      this.nlp = new NLProcessor(config.nlp);
      this.memory = new MemoryManager(config.memory || {});
      this._setupSystemDefaults();
      
      if (this.config.debug) {
        console.log(chalk.green('HadesAgent initialized successfully'));
      }
    } catch (err) {
      console.error(chalk.red('Initialization failed:'), this._getErrorMessage(err));
      throw new Error(`Failed to initialize HadesAgent: ${this._getErrorMessage(err)}`);
    }
  }

  _initializeAIIntegrations(config) {
    this.aiProviders = new Map();
    
    // Initialize providers in priority order
    const providers = {
      openrouter: {
        class: OpenRouterIntegration,
        envKey: 'OPENROUTER_API_KEY',
        configKey: 'openrouter'
      },
      openai: {
        class: OpenAIIntegration,
        envKey: 'OPENAI_API_KEY',
        configKey: 'openai'
      },
      deepseek: {
        class: DeepSeekIntegration,
        envKey: 'DEEPSEEK_API_KEY',
        configKey: 'deepseek'
      },
      groq: {
        class: GroqIntegration,
        envKey: 'GROQ_API_KEY',
        configKey: 'groq'
      },
      perplexity: {
        class: PerplexityIntegration,
        envKey: 'PERPLEXITY_API_KEY',
        configKey: 'perplexity'
      },
      huggingface: {
        class: HuggingFaceIntegration,
        envKey: 'HUGGINGFACE_API_KEY',
        configKey: 'huggingface'
      },
      aimlapi: {
        class: AIMLAPIIntegration,
        envKey: 'AIMLAPI_KEY',
        configKey: 'aimlapi'
      }
    };

    for (const [providerName, providerConfig] of Object.entries(providers)) {
      try {
        const apiKey = config.integration?.[providerConfig.configKey]?.apiKey || 
                      process.env[providerConfig.envKey];
        
        if (apiKey) {
          this.aiProviders.set(
            providerName,
            new providerConfig.class({
              ...config.integration?.[providerConfig.configKey],
              apiKey
            })
          );
        }
      } catch (err) {
        console.error(chalk.red(`${providerName} API initialization failed:`), this._getErrorMessage(err));
      }
    }

    if (this.config.debug) {
      console.log(chalk.blue(`Initialized AI providers: ${Array.from(this.aiProviders.keys()).join(', ')}`));
    }
  }

  _initializeCoreComponents(config) {
    this.topics = new Map();
    this.topicLoader = new TopicLoader({ debug: this.config.debug });
    
    const loadedTopics = this.topicLoader.loadTopicsFromDirectory(
      this.config.topicsDirectory
    );
    this.topics = loadedTopics instanceof Map ? loadedTopics : this._convertToMap(loadedTopics);
    
    this.nlp = new NLProcessor(config.nlp);
    this.memory = new MemoryManager(config.memory || {});
  }

  _setupSystemDefaults() {
    this.state = {
      current: 'initial',
      context: {
        activeTopics: [],
        userProfile: {},
        emotionalState: 0
      }
    };
    this.setupFallbacks();
    this.setupActions();
  }

  _getErrorMessage(error) {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (error?.message) return error.message;
    if (error?.error) return error.error;
    try {
      const str = JSON.stringify(error);
      return str === '{}' ? 'Unknown error' : str;
    } catch {
      return 'Unknown error occurred';
    }
  }

  async processInput(input) {
    try {
      if (!input || typeof input !== 'string') {
        throw new Error('Invalid input: must be a non-empty string');
      }

      const processed = await this._processInputWithNLP(input);
      this._storeInMemory(processed);

      const actionResponse = this.checkActions(processed.text);
      if (actionResponse) return actionResponse;

      const topicMatch = await this.findBestTopicMatch(processed.text);
      const response = await this.generateResponse(processed.text, topicMatch, processed);
      
      this._updateState(processed.text, response, topicMatch);
      return response;
    } catch (err) {
      console.error('Input processing error:', this._getErrorMessage(err));
      return this.getContextualFallback(input, { sentiment: 0 });
    }
  }

  async _processInputWithNLP(input) {
    try {
      const processed = await this.nlp.process(input);
      return processed || { text: input, sentiment: 0 };
    } catch (err) {
      console.error('NLP processing error:', this._getErrorMessage(err));
      return { text: input, sentiment: 0 };
    }
  }

  _storeInMemory(processed) {
    try {
      this.memory.store('shortTerm', {
        input: processed.text,
        analysis: processed
      });
    } catch (err) {
      console.error('Memory storage error:', this._getErrorMessage(err));
    }
  }

  addTopic(topic) {
    if (topic?.name) {
      this.topics.set(topic.name, topic);
      return true;
    }
    return false;
  }

  async findBestTopicMatch(input, context = {}) {
    // Initialize best match with default values
    let bestMatch = {
        score: 0,
        topic: null,
        pattern: null,
        matchedText: null
    };

    // Return early if no input
    if (!input || typeof input !== 'string') {
        return bestMatch;
    }

    try {
        // Process input with NLP (if available)
        const processedInput = this.nlp 
            ? await this.nlp.process(input) 
            : { tokens: input.toLowerCase().split(/\s+/), stemmed: input.toLowerCase() };

        // Check all topics for matches
        for (const [topicName, topic] of this.topics) {
            try {
                // 1. Check patterns first
                for (const pattern of topic.patterns || []) {
                    const regex = new RegExp(pattern, 'i');
                    const match = regex.exec(input);
                    if (match) {
                        const score = this.calculatePatternScore(match[0].length, input.length);
                        if (score > bestMatch.score) {
                            bestMatch = {
                                score,
                                topic,
                                pattern,
                                matchedText: match[0]
                            };
                        }
                    }
                }

                // 2. Check keywords if no strong pattern match
                if (bestMatch.score < 0.7 && topic.keywords) {
                    const keywordScore = this.calculateKeywordScore(
                        processedInput.tokens || [],
                        topic.keywords,
                        processedInput.stemmed || input.toLowerCase()
                    );
                    
                    if (keywordScore > bestMatch.score) {
                        bestMatch = {
                            score: keywordScore,
                            topic,
                            pattern: null,
                            matchedText: null
                        };
                    }
                }

                // 3. Check custom matcher function if available
                if (typeof topic.match === 'function') {
                    const customMatch = await topic.match(input, context);
                    if (customMatch && customMatch.score > bestMatch.score) {
                        bestMatch = {
                            score: customMatch.score,
                            topic,
                            pattern: customMatch.pattern,
                            matchedText: customMatch.matchedText
                        };
                    }
                }

            } catch (err) {
                console.error(`Error matching topic ${topicName}:`, this._getErrorMessage(err));
                continue;
            }
        }

        // Apply minimum score threshold
        if (bestMatch.score < this.config.minMatchScore) {
            return {
                score: 0,
                topic: null,
                pattern: null,
                matchedText: null
            };
        }

        return bestMatch;

    } catch (err) {
        console.error('Topic matching system error:', this._getErrorMessage(err));
        return {
            score: 0,
            topic: null,
            pattern: null,
            matchedText: null
        };
    }
  }

  isKnowledgeQuestion(input) {
    if (!input) return false;
  
    const knowledgeTriggers = [
      'what', 'who', 'when', 'where', 'why', 'how',
      'explain', 'define', 'tell me about', 'describe',
      'can you', 'could you', '?',
      'how to', 'steps to', 'guide for'
    ];
  
    return knowledgeTriggers.some(trigger => 
      input.toLowerCase().includes(trigger)
    );
  }

  // Helper methods
  calculatePatternScore(matchLength, inputLength) {
    // Score based on how much of the input was matched
    const coverage = matchLength / inputLength;
    // Bonus for exact matches
    const exactMatchBonus = matchLength === inputLength ? 0.2 : 0;
    return Math.min(1, (coverage * 0.8) + exactMatchBonus);
  }

  calculateKeywordScore(tokens, keywords, stemmedInput) {
    let score = 0;
    const keywordHits = [];
    
    keywords.forEach(keyword => {
        if (typeof keyword === 'string') {
            if (stemmedInput.includes(keyword.toLowerCase())) {
                score += 0.3; // Base score for string match
                keywordHits.push(keyword);
            }
        } else if (keyword.regex) {
            const regex = new RegExp(keyword.regex, 'i');
            if (regex.test(stemmedInput)) {
                score += keyword.weight || 0.5;
                keywordHits.push(keyword.regex);
            }
        }
    });

    // Normalize score
    const maxPossibleScore = keywords.reduce((sum, kw) => sum + (kw.weight || 0.5), 0);
    const normalizedScore = maxPossibleScore > 0 ? score / maxPossibleScore : 0;

    // Apply diminishing returns for many weak matches
    return keywordHits.length > 5 
        ? normalizedScore * (5 / keywordHits.length)
        : normalizedScore;
  }

  async generateTopicResponse(input, matchResult = {}, nlpAnalysis = {}) {
    try {
      if (matchResult.topic && typeof matchResult.topic.generateResponse === 'function') {
        const response = await matchResult.topic.generateResponse(input, {
          sentiment: nlpAnalysis.sentiment,
          state: this.state
        });
        return response || this.getContextualFallback(input, nlpAnalysis);
      }
    
      return this.getContextualFallback(input, nlpAnalysis);
    } catch (err) {
      console.error('Topic response generation error:', this._getErrorMessage(err));
      return this.getContextualFallback(input, nlpAnalysis);
    }
  }
  async generateResponse(input, matchResult = {}, nlpAnalysis) {
    try {
      matchResult = {
        score: 0,
        topic: null,
        ...matchResult
      };

      if (this.config.debug) {
        console.log('Response decision:', {
          input,
          hasAIProviders: this.aiProviders.size > 0,
          topicMatch: matchResult.topic?.name,
          score: matchResult.score,
          isKnowledge: this.isKnowledgeQuestion(input)
        });
      }

      if (this.shouldUseAI(input, matchResult)) {
        try {
          const aiResponse = await this.generateAIResponse(input, {
            sentiment: nlpAnalysis?.sentiment,
            topic: matchResult.topic?.name
          });
          
          if (aiResponse?.response) {
            return {
              response: aiResponse.response.replace(/\[INST\].*?\[\/INST\]/g, '').trim(),
              topic: matchResult.topic?.name || 'ai-response',
              metadata: {
              type: 'ai-response',
              provider: aiResponse.provider
              }
            };
          }
        } catch (apiError) {
          console.error('AI generation error:', this._getErrorMessage(apiError));
        }
      }

      return await this.generateTopicResponse(input, matchResult, nlpAnalysis);
    } catch (err) {
      console.error('Response generation error:', this._getErrorMessage(err));
      return this.getContextualFallback(input, nlpAnalysis || { sentiment: 0 });
    }
  }

  async generateAIResponse(input, options = {}) {
    if (!input || this.aiProviders.size === 0) {
      return null;
    }
  
    const priorityOrder = options.priority || this.config.aiPriority;
    let lastError = null;
  
    for (const providerName of priorityOrder) {
      const provider = this.aiProviders.get(providerName);
      if (!provider) continue;
    
      for (let attempt = 0; attempt < this.config.aiRetryAttempts; attempt++) {
        try {
          let response = await provider.generateResponse(input, options);
        
          if (response) {
            // Format HuggingFace responses to be more concise
            if (providerName === 'huggingface') {  // Removed typeof check since providers should always return strings
              response = this._formatHuggingFaceResponse(response, input);
            }
          
            return {
              response,
              provider: providerName,  // This is where providerName should be properly defined
              attempt: attempt + 1,
              timestamp: new Date().toISOString()
            };
          }
        } catch (err) {
          lastError = err;
          if (this.config.debug) {
            console.log(chalk.yellow(`Attempt ${attempt + 1} with ${providerName} failed:`), this._getErrorMessage(err));
          }
        
          if (err.message.includes('rate limit') || err.message.includes('too many requests')) {
            break;
          }
        }
      }
    }
  
    if (this.config.debug && lastError) {
      console.log(chalk.red('All AI providers failed:'), this._getErrorMessage(lastError));
    }
  
    return null;
  }

  _formatHuggingFaceResponse(response, userInput) {
    try {
      // Ensure response is a string
      let cleanResponse = typeof response === 'string' ? response : JSON.stringify(response);

      // First try to extract from JSON if possible
      if (cleanResponse.startsWith('{') || cleanResponse.startsWith('[')) {
        try {
          const parsed = JSON.parse(cleanResponse);
          if (parsed.generated_text) {
            cleanResponse = parsed.generated_text;
          } else if (Array.isArray(parsed)) {
            cleanResponse = parsed[0]?.generated_text || parsed[0] || cleanResponse;
          }
        } catch (e) {
          // If JSON parsing fails, continue with string processing
        }
      }

      // Remove any instruction formatting
      cleanResponse = cleanResponse
        .replace(/\[INST\].*?\[\/INST\]/g, '')
        .replace(/Question:.*?\n/g, '')
        .replace(/Input:.*?\n/g, '')
        .replace(/.*?:.*?\n/g, '')  // Remove any lines with colons (common in instruction formats)
        .replace(/<.*?>/g, '');

      // Remove the repeated question if it appears at start
      if (userInput) {
        const questionPattern = new RegExp(`^\\s*${userInput}[:.]?\\s*`, 'i');
        cleanResponse = cleanResponse.replace(questionPattern, '');
      }

      // Extract just the first sentence if it's too verbose
      const firstSentence = cleanResponse.split(/[.!?]\s+/)[0];
      if (firstSentence && firstSentence.length > 10 && firstSentence.length < 150) {
        cleanResponse = firstSentence;
      }

      // Final cleanup
      return cleanResponse
        .replace(/\n+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .substring(0, 150)  // Shorter limit for concise answers
        .trim();
    } catch (err) {
      console.error('Error formatting HuggingFace response:', err);
      return typeof response === 'string' 
        ? response.substring(0, 250).trim() 
        : 'AI response';
    }
  }

  shouldUseAI(input, matchResult = {}) {
    return this.aiProviders.size > 0 && (
      this.isKnowledgeQuestion(input) ||
      !matchResult.topic ||
      matchResult.score < this.config.aiCutoffScore ||
      input.length > 3
    );
  }

  async getContextualFallback(input, nlpAnalysis = {}) {
    try {
      // Only attempt AI fallback if we haven't already tried it
      if (!nlpAnalysis.attemptedAI) {
        const aiResponse = await this.generateAIResponse(input, {
          isFallback: true,
          sentiment: nlpAnalysis.sentiment
        });
      
        if (aiResponse) {
          return {
            response: aiResponse.response,
            topic: 'general',
            metadata: { 
              type: 'ai-fallback',
              provider: aiResponse.provider
            }
          };
        }
      }

      // Default fallback responses
      const inputLower = input?.toLowerCase() || '';
    
      if (nlpAnalysis.sentiment < -0.3) {
        return {
          response: "That sounds difficult. Would you like to talk more about it?",
          topic: 'emotional-support',
          metadata: { type: 'emotional-fallback' }
        };
      }

      if (inputLower.includes('?')) {
        return {
          response: "I'm not sure about that. Could you ask in a different way?",
          topic: 'clarification',
          metadata: { type: 'question-fallback' }
        };
      } 

      return {
        response: "I'd like to understand better. Can you explain in different words?",
        topic: 'general',
        metadata: { type: 'default-fallback' }
      };
    } catch (err) {
      console.error('Fallback error:', this._getErrorMessage(err));
      return {
        response: "Sorry, I'm having trouble responding. Please try again.",
        topic: 'error',
        metadata: { type: 'error-fallback' }
      };
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

  checkActions(input) {
    if (!this.actions || !input) return null;
    
    for (const [actionName, action] of Object.entries(this.actions)) {
      try {
        if (action.pattern.test(input)) {
          return typeof action.execute === 'function' ? 
            action.execute() : 
            {
              response: `Action ${actionName} triggered but no handler`,
              topic: 'system',
              metadata: { type: 'action' }
            };
        }
      } catch (err) {
        console.error(`Error checking action ${actionName}:`, this._getErrorMessage(err));
      }
    }
    return null;
  }

  _updateState(input, response, topicMatch) {
    try {
      if (topicMatch?.topic?.name) {
        if (!this.state.context.activeTopics.includes(topicMatch.topic.name)) {
          this.state.context.activeTopics.unshift(topicMatch.topic.name);
        }
        
        if (this.state.context.activeTopics.length > this.config.maxTopicsActive) {
          this.state.context.activeTopics.pop();
        }
      }

      this.state.context.emotionalState = this.memory.getRecentSentimentAverage(3) || 0;

      if (topicMatch?.topic?.updateProfile) {
        this.state.context.userProfile = {
          ...this.state.context.userProfile,
          ...topicMatch.topic.updateProfile(input, this.state.context.userProfile)
        };
      }
    } catch (err) {
      console.error('State update error:', this._getErrorMessage(err));
    }
  }

  addEmpathy(response) {
    if (!response) return response;
    
    const empatheticPhrases = [
      "I can imagine this must be difficult.",
      "This sounds challenging.",
      "I understand this might be hard.",
      "I hear how important this is."
    ];
    return `${empatheticPhrases[Math.floor(Math.random() * empatheticPhrases.length)]} ${response}`;
  }

  getHelpResponse() {
    try {
      const actionList = Object.keys(this.actions).map(action => 
        `• ${action}: ${this.actions[action].pattern.toString()}`
      ).join('\n');

      return `I can help with these commands:\n${actionList}\n\n` +
            `You can also talk to me about: ${Array.from(this.topics.keys()).slice(0, 5).join(', ')}...`;
    } catch (err) {
      console.error('Help response error:', this._getErrorMessage(err));
      return "I can help with various topics. Type 'help' for more information.";
    }
  }

  _convertToMap(topicsArray) {
    const map = new Map();
    if (!topicsArray) return map;
    
    topicsArray.forEach(topic => {
      if (topic?.name) {
        map.set(topic.name, topic);
      }
    });
    return map;
  }

  _logLoadedTopics() {
    console.log('Loaded topics:');
    this.topics.forEach((topic, name) => {
      console.log(`- ${name} (${topic.keywords?.length || 0} keywords, ${topic.patterns?.length || 0} patterns)`);
    });
  }
}

module.exports = HadesAgent;