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
      emotionalState: 0
    };
    this.initNLP();
    this.loadTopics();
  }

  initNLP() {
    this.tokenizer = new natural.WordTokenizer();
    this.stemmer = natural.PorterStemmer;
    this.analyzer = new natural.SentimentAnalyzer('English', this.stemmer, 'afinn');
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
    // Special commands first
    const command = this.checkCommands(input);
    if (command) return command;

    // Store conversation history
    this.storeHistory(input);

    // Analyze sentiment
    this.analyzeSentiment(input);

    // Check for clarification requests
    const clarification = this.checkForClarification(input);
    if (clarification) return clarification;

    // Find matching topic with context awareness
    const topic = this.findContextAwareTopic(input);

    // Generate response
    const response = this.generateResponse(input, topic);

    // Update context
    this.updateContext(input, response, topic);

    return response;
  }

  checkCommands(input) {
    const lowerInput = input.toLowerCase().trim();
    const commands = {
      'exit': { 
        response: chalk.magenta("Goodbye! Our conversation was meaningful."), 
        exit: true 
      },
      'help': { 
        response: `I can discuss: ${this.topics.map(t => t.name).join(', ')}\n` +
                 "Special commands: help, exit, topics", 
        topic: 'system' 
      },
      'topics': { 
        response: `Active topics: ${this.context.activeTopics.join(', ') || 'none'}\n` +
                 `All topics: ${this.topics.map(t => t.name).join(', ')}`, 
        topic: 'system' 
      }
    };
    return commands[lowerInput];
  }

  storeHistory(input) {
    this.conversationHistory.push({
      input,
      timestamp: new Date(),
      sentiment: this.context.emotionalState
    });
  }

  analyzeSentiment(input) {
    try {
      const tokens = this.tokenizer.tokenize(input);
      const stems = tokens.map(token => this.stemmer.stem(token));
      this.context.emotionalState = this.analyzer.getSentiment(stems);
    } catch (err) {
      console.error("Sentiment error:", err);
      this.context.emotionalState = 0;
    }
  }

  checkForClarification(input) {
    const lastResponse = this.context.lastResponses[0];
    if (!lastResponse) return null;

    const clarificationPatterns = [
      /what (is|are|does|do) (that|this|\w+)/i,
      /explain (that|this|\w+)/i,
      /how (does|do) (that|this|\w+)/i,
      /what (do you|does that) mean/i
    ];

    if (clarificationPatterns.some(p => p.test(input))) {
      const explanation = this.getExplanation(input, lastResponse);
      return {
        response: explanation || "I was discussing " + lastResponse.topic + ". What specifically should I explain?",
        topic: 'clarification'
      };
    }
    return null;
  }

  getExplanation(input, lastResponse) {
    // Check for term in deepKnowledge
    const termMatch = input.match(/what (is|are|does|do) (\w+)/i) || 
                     input.match(/explain (\w+)/i);
    if (termMatch && lastResponse.topicObj?.deepKnowledge?.[termMatch[2]]) {
      return lastResponse.topicObj.deepKnowledge[termMatch[2]].explanation;
    }

    // Check for solution explanation
    const solutionMatch = input.match(/what is (\w+ \w+) solution/i);
    if (solutionMatch && lastResponse.solutions) {
      const solution = lastResponse.solutions.find(s => s.includes(solutionMatch[1]));
      if (solution && lastResponse.topicObj?.solutionExplanations?.[solution]) {
        return lastResponse.topicObj.solutionExplanations[solution];
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

      // Keyword matches
      score += topic.keywords.filter(kw => 
        inputLower.includes(kw.toLowerCase())
      ).length;

      // Pattern matches
      const patternMatch = topic.patterns.find(p => 
        new RegExp(p.regex, 'i').test(input)
      );
      if (patternMatch) score += 2;

      // Context bonus
      if (this.context.activeTopics.includes(topic.name)) score += 1;

      if (score > bestMatch.score) {
        bestMatch = { score, topic };
      }
    });

    return bestMatch.topic;
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
        response: "I'd like to understand more about that. Could you elaborate?",
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
      const fallbacks = topic.defaultResponses || [
        "Tell me more about that.",
        "How does that make you feel?",
        "What would you like to explore about this?"
      ];
      response = fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    // Add empathy if negative sentiment
    if (this.context.emotionalState < -0.5) {
      const empathicPhrases = [
        "I sense this is difficult for you.",
        "I hear the concern in your words.",
        "This seems important to you."
      ];
      response = empathicPhrases[
        Math.floor(Math.random() * empathicPhrases.length)
      ] + " " + response;
    }

    return {
      response,
      topic: topic.name,
      topicObj: topic
    };
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
    // Extract financial info
    const moneyMatch = input.match(/\$?(\d{3,})/);
    if (moneyMatch) {
      this.context.userProfile.financialRange = 
        parseInt(moneyMatch[1]) > 1000 ? "high" : "low";
    }

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