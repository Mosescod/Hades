const fs = require('fs');
const path = require('path');
const natural = require('natural');
const chalk = require('chalk');
const readline = require('readline');

class HadesCore {
  constructor() {
    this.topics = [];
    this.conversationHistory = [];
    this.context = {
      activeTopics: [],
      lastResponses: [],
      userProfile: {},
      emotionalState: 0,
      awaitingClarification: null
    };
    this.initNLP();
    this.loadTopics();
    this.setupFallbacks();
  }

  initNLP() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.analyzer = new natural.SentimentAnalyzer('English', this.stemmer, 'afinn');
    this.spellcheck = new natural.Spellcheck(['money', 'tournament', 'stress', 'training']);
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
      ],
      affirmation: [
        "What specifically would you like to know?",
        "Which aspect interests you most?",
        "How can I elaborate on that?"
      ]
    };
  }

  loadTopics() {
    const topicsDir = path.join(__dirname, 'topics');
    if (!fs.existsSync(topicsDir)) fs.mkdirSync(topicsDir);
    
    fs.readdirSync(topicsDir).forEach(file => {
      if (file.endsWith('.js')) {
        try {
          const topic = require(path.join(topicsDir, file));
          if (this.validateTopic(topic)) {
            this.topics.push(topic);
            console.log(chalk.green(`✓ Loaded topic: ${topic.name}`));
          }
        } catch (err) {
          console.error(chalk.red(`× Error loading ${file}:`), err.message);
        }
      }
    });
  }

  validateTopic(topic) {
    const required = ['name', 'description', 'keywords', 'patterns'];
    if (!required.every(prop => topic[prop])) {
      console.error(chalk.yellow(`! Topic ${topic.name || 'unnamed'} missing required properties`));
      return false;
    }
    return true;
  }

  processInput(input) {
    // Preprocess input
    const processedInput = this.preprocessInput(input);

    // Store conversation history
    this.storeHistory(processedInput);

    // Check for special commands first
    const command = this.checkCommands(processedInput);
    if (command) return command;

    // Analyze sentiment
    this.analyzeSentiment(processedInput);

    // Handle awaiting clarification
    if (this.context.awaitingClarification) {
      return this.handlePendingClarification(processedInput);
    }

    // Check for affirmation responses
    if (this.isAffirmation(processedInput)) {
      return this.handleAffirmation();
    }

    // Check for clarification requests
    const clarification = this.checkForClarification(processedInput);
    if (clarification) return clarification;

    // Find context-aware topic
    const topic = this.findContextAwareTopic(processedInput);

    // Generate response
    const response = this.generateResponse(processedInput, topic);

    // Update context
    this.updateContext(processedInput, response, topic);

    return response;
  }

  preprocessInput(input) {
    // Basic cleaning
    let processed = input.toLowerCase()
      .replace(/[^\w\s]|_/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Fix common contractions
    const contractions = {
      "i'm": "i am",
      "you're": "you are",
      "don't": "do not",
      "can't": "cannot",
      "won't": "will not"
    };
    Object.keys(contractions).forEach(key => {
      processed = processed.replace(new RegExp(`\\b${key}\\b`, 'g'), contractions[key]);
    });

    // Basic spell checking
    const words = this.tokenizer.tokenize(processed);
    processed = words.map(word => {
      const corrections = this.spellcheck.getCorrections(word, 1);
      return corrections.length > 0 ? corrections[0] : word;
    }).join(' ');

    return processed;
  }

  storeHistory(input) {
    this.conversationHistory.push({
      raw: input,
      processed: this.preprocessInput(input),
      timestamp: new Date(),
      sentiment: this.context.emotionalState
    });

    // Keep history manageable
    if (this.conversationHistory.length > 20) {
      this.conversationHistory.shift();
    }
  }

  analyzeSentiment(input) {
    try {
      const tokens = this.tokenizer.tokenize(input);
      const stems = tokens.map(token => this.stemmer.stem(token));
      this.context.emotionalState = this.analyzer.getSentiment(stems);
    } catch (err) {
      console.error("Sentiment analysis error:", err);
      this.context.emotionalState = 0;
    }
  }

  checkCommands(input) {
    const commands = {
      'exit': { 
        response: chalk.magenta("Goodbye! Our conversation was meaningful."), 
        exit: true 
      },
      'help': { 
        response: `I can discuss: ${this.topics.map(t => t.name).join(', ')}\n` +
                 "Special commands: help, exit, topics, reset", 
        topic: 'system' 
      },
      'topics': { 
        response: `Active topics: ${this.context.activeTopics.join(', ') || 'none'}\n` +
                 `All topics: ${this.topics.map(t => t.name).join(', ')}`, 
        topic: 'system' 
      },
      'reset': {
        response: chalk.yellow("I've reset our conversation context."),
        topic: 'system',
        action: () => {
          this.context.activeTopics = [];
          this.context.lastResponses = [];
        }
      }
    };

    const lowerInput = input.toLowerCase().trim();
    if (commands[lowerInput]) {
      if (commands[lowerInput].action) {
        commands[lowerInput].action();
      }
      return commands[lowerInput];
    }
    return null;
  }

  isAffirmation(input) {
    return input.match(/^(yes|yeah|yep|sure|ok|agree)\b/i);
  }

  handleAffirmation() {
    const lastResponse = this.context.lastResponses[0];
    if (!lastResponse) return this.getFallback('general');

    if (lastResponse.topicObj?.followUpQuestions) {
      const followUp = lastResponse.topicObj.followUpQuestions[
        Math.floor(Math.random() * lastResponse.topicObj.followUpQuestions.length)
      ];
      return {
        response: followUp,
        topic: lastResponse.topic
      };
    }

    return {
      response: this.getFallback('affirmation'),
      topic: lastResponse.topic || 'general'
    };
  }

  checkForClarification(input) {
    const lastResponse = this.context.lastResponses[0];
    if (!lastResponse) return null;

    const clarificationPatterns = [
      /what (is|are|does|do) (that|this|\w+)/i,
      /explain (that|this|\w+)/i,
      /how (does|do) (that|this|\w+)/i,
      /what (do you|does that) mean/i,
      /i don('| )t understand/i
    ];

    if (clarificationPatterns.some(p => p.test(input))) {
      const explanation = this.getExplanation(input, lastResponse);
      if (explanation) {
        return {
          response: explanation,
          topic: 'clarification'
        };
      }

      this.context.awaitingClarification = {
        target: lastResponse,
        originalInput: input
      };

      return {
        response: "What specific part of our conversation about " + 
                 lastResponse.topic + " should I explain?",
        topic: 'clarification'
      };
    }
    return null;
  }

  handlePendingClarification(input) {
    const pending = this.context.awaitingClarification;
    this.context.awaitingClarification = null;

    const explanation = this.getExplanation(input, pending.target);
    if (explanation) {
      return {
        response: explanation,
        topic: 'clarification'
      };
    }

    return {
      response: "I'm not sure how to explain that part. Maybe ask differently?",
      topic: 'clarification'
    };
  }

  getExplanation(input, lastResponse) {
    // Check for specific term explanation
    const termMatch = input.match(/what (is|are|does|do) (\w+)/i) || 
                     input.match(/explain (\w+)/i);
    if (termMatch) {
      const term = termMatch[2];
      // Check topic's deep knowledge
      if (lastResponse.topicObj?.deepKnowledge?.[term]) {
        return lastResponse.topicObj.deepKnowledge[term].explanation;
      }
      // Check solution explanations
      if (lastResponse.solutions) {
        const solution = lastResponse.solutions.find(s => s.includes(term));
        if (solution && lastResponse.topicObj?.solutionExplanations?.[solution]) {
          return lastResponse.topicObj.solutionExplanations[solution];
        }
      }
    }

    // Check for general concept explanation
    if (lastResponse.topicObj?.deepKnowledge) {
      const conceptMatch = input.match(/what (is|are) (\w+ \w+)/i);
      if (conceptMatch) {
        const concept = conceptMatch[2];
        if (lastResponse.topicObj.deepKnowledge[concept]) {
          return lastResponse.topicObj.deepKnowledge[concept].explanation;
        }
      }
    }

    return null;
  }

  findContextAwareTopic(input) {
    // 1. Check cross-topic handlers
    const crossTopicResponse = this.checkCrossTopics(input);
    if (crossTopicResponse) return crossTopicResponse;

    // 2. Find best matching topic
    return this.findBestTopicMatch(input);
  }

  checkCrossTopics(input) {
    for (const activeTopic of this.context.activeTopics) {
      const topic = this.topics.find(t => t.name === activeTopic);
      if (!topic?.crossTopicHandlers) continue;

      for (const [otherTopic, handler] of Object.entries(topic.crossTopicHandlers)) {
        const response = handler(input, this.context);
        if (response) {
          const targetTopic = this.topics.find(t => t.name === otherTopic);
          if (targetTopic) {
            return {
              ...targetTopic,
              forcedResponse: response
            };
          }
        }
      }
    }
    return null;
  }

  findBestTopicMatch(input) {
    const inputLower = input.toLowerCase();
    let bestMatch = { score: 0, topic: null };

    this.topics.forEach(topic => {
      let score = 0;

      // Keyword matching
      score += topic.keywords.filter(kw => 
        inputLower.includes(kw.toLowerCase())
      ).length * 0.5;

      // Pattern matching
      const patternMatch = topic.patterns.find(p => 
        new RegExp(p.regex, 'i').test(input)
      );
      if (patternMatch) score += 2;

      // Context bonus for active topics
      if (this.context.activeTopics.includes(topic.name)) score += 1;

      // Emotional alignment
      if (topic.sentimentBias) {
        const alignment = 1 - Math.abs(topic.sentimentBias - this.context.emotionalState);
        score += alignment * 0.5;
      }

      if (score > bestMatch.score) {
        bestMatch = { score, topic };
      }
    });

    return bestMatch.score > 1.5 ? bestMatch.topic : null;
  }

  generateResponse(input, topic) {
    // Handle forced response (from cross-topic)
    if (topic?.forcedResponse) {
      return {
        response: topic.forcedResponse.response,
        topic: topic.name,
        solutions: topic.forcedResponse.solutions,
        topicObj: topic
      };
    }

    // Handle no topic found
    if (!topic) {
      return {
        response: this.getFallback('general'),
        topic: 'general'
      };
    }

    // Find matching pattern
    const pattern = topic.patterns.find(p => 
      new RegExp(p.regex, 'i').test(input)
    );

    // Generate response
    let response;
    if (pattern) {
      const responses = pattern.responses || topic.defaultResponses || [];
      response = responses[Math.floor(Math.random() * responses.length)];

      // Apply transformations
      if (pattern.transform) {
        response = pattern.transform(response, input, this.context);
      }

      // Replace placeholders
      const matches = input.match(new RegExp(pattern.regex, 'i'));
      if (matches) {
        for (let i = 1; i < matches.length; i++) {
          response = response.replace(new RegExp(`%${i}`, 'g'), matches[i]);
        }
      }

      // Insert solutions
      if (response.includes('%solution') && topic.solutions) {
        const solution = topic.solutions[
          Math.floor(Math.random() * topic.solutions.length)
        ];
        response = response.replace('%solution', solution);
      }
    } else {
      const fallbacks = topic.defaultResponses || [this.getFallback('general')];
      response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    // Add empathy if negative sentiment
    if (this.context.emotionalState < -0.5) {
      response = this.addEmpathy(response);
    }

    return {
      response,
      topic: topic.name,
      topicObj: topic
    };
  }

  addEmpathy(response) {
    const empathicPhrases = [
      "I understand this might be difficult.",
      "I hear the concern in your words.",
      "This seems important to you.",
      "I sense this is weighing on you."
    ];
    return empathicPhrases[
      Math.floor(Math.random() * empathicPhrases.length)
    ] + " " + response;
  }

  getFallback(type) {
    return this.fallbacks[type][
      Math.floor(Math.random() * this.fallbacks[type].length)
    ];
  }

  updateContext(input, response, topic) {
    // Update active topics
    if (topic?.name && !this.context.activeTopics.includes(topic.name)) {
      this.context.activeTopics.unshift(topic.name);
      if (this.context.activeTopics.length > 3) {
        this.context.activeTopics.pop();
      }
    }

    // Update response history
    this.context.lastResponses.unshift({
      response: response.response,
      topic: topic?.name || 'general',
      topicObj: topic,
      solutions: response.solutions,
      timestamp: new Date()
    });
    if (this.context.lastResponses.length > 3) {
      this.context.lastResponses.pop();
    }

    // Extract user profile information
    this.extractProfileInfo(input, topic);
  }

  extractProfileInfo(input, topic) {
    // Let topic module extract its own info
    if (topic?.updateProfile) {
      this.context.userProfile = {
        ...this.context.userProfile,
        ...topic.updateProfile(input, this.context.userProfile)
      };
    }
  }
}

// CLI Interface
function startHades() {
  const hades = new HadesCore();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(chalk.green.bold(`
  ██   ██  █████  ██████  ███████ ███████ 
  ██   ██ ██   ██ ██   ██ ██      ██      
  ███████ ███████ ██   ██ █████   █████   
  ██   ██ ██   ██ ██   ██ ██      ██      
  ██   ██ ██   ██ ██████  ███████ ███████ 
  `));

  console.log(chalk.yellow(
    `\nHADES: I can discuss ${hades.topics.map(t => t.name).join(', ')}\n` +
    `Type ${chalk.cyan('help')} for options or ${chalk.cyan('exit')} to end.\n`
  ));

  const chat = () => {
    rl.question(chalk.blue('You: '), (input) => {
      const result = hades.processInput(input);
      
      console.log(chalk.magenta(
        `HADES [${result.topic || 'general'}]: ${result.response}\n`
      ));
      
      if (result.exit) {
        rl.close();
      } else {
        chat();
      }
    });
  };

  chat();
}

startHades();