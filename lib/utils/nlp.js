const natural = require('natural');
const { WordTokenizer, PorterStemmer, SentimentAnalyzer, Spellcheck } = natural;
const config = require('../config');

class NLProcessor {
  constructor(settings = {}) {
    this.tokens = [];
    this.config = {
      enableSentiment: false,
      enableSpellcheck: false,
      enableStemming: true,
      ...settings // User settings override defaults
    };
    this.tokenizer = new WordTokenizer();
    this.stemmer = PorterStemmer;
    
    // Initialize enabled features
    if (this.config.enableSentiment) {
      this.analyzer = new SentimentAnalyzer('English', this.stemmer, 'afinn');
    }
    
    if (this.config.enableSpellcheck) {
      this.spellcheck = new Spellcheck([]); // Empty dictionary by default
    }
    
    this.contractions = {
      "i'm": "i am",
      "you're": "you are",
      "don't": "do not",
      "can't": "cannot",
      "won't": "will not",
      "isn't": "is not"
    };
    
    this.customPatterns = {
      amounts: /\$?\d+(?:,\d{3})*(?:\.\d{2})?/g,
      durations: /\b\d+\s+(?:hours?|days?|weeks?|months?)\b/gi,
      percentages: /\b\d+%\b/g
    };
  }

  async process(text) {
    const result = {
      original: text,
      text: text.toLowerCase(),
      tokens: [],
      stems: [],
      sentiment: 0,
      entities: {},
      spellchecked: false
    };

    // Basic cleaning
    result.text = result.text
      .replace(/[^\w\s$%.,]|_/g, "")
      .replace(/\s+/g, " ")
      .trim();

    // Expand contractions
    result.text = this.expandContractions(result.text);

    // Tokenization
    result.tokens = this.tokenizer.tokenize(result.text);
    
    // Stemming if enabled
    if (this.config.enableStemming) {
      result.stems = result.tokens.map(token => this.stemmer.stem(token));
    } else {
      result.stems = [...result.tokens];
    }

    // Spell checking if enabled
    if (this.config.enableSpellcheck && this.spellcheck) {
      result.text = this.applySpellcheck(result.tokens).join(' ');
      result.spellchecked = true;
    }

    // Sentiment analysis if enabled
    if (this.config.enableSentiment && this.analyzer) {
      try {
        result.sentiment = this.analyzer.getSentiment(result.stems);
      } catch (err) {
        console.error('Sentiment analysis error:', err);
        result.sentiment = 0;
      }
    }

    // Entity extraction
    result.entities = this.extractEntities(result.text);

    return result;
  }

  expandContractions(text) {
    let processed = text;
    Object.keys(this.contractions).forEach(key => {
      processed = processed.replace(new RegExp(`\\b${key}\\b`, 'g'), this.contractions[key]);
    });
    return processed;
  }

  applySpellcheck(tokens) {
    return tokens.map(word => {
      if (this.spellcheck.isCorrect(word)) return word;
      
      const corrections = this.spellcheck.getCorrections(word, 1);
      return corrections.length > 0 ? corrections[0] : word;
    });
  }

  extractEntities(text) {
  const entities = {};
  
  // Tokenize the text here since we're not using this.tokens
  const tokens = this.tokenizer.tokenize(text.toLowerCase());
  
  // Extract known pattern matches
  Object.keys(this.customPatterns).forEach(type => {
    const matches = text.match(this.customPatterns[type]);
    if (matches) {
      entities[type] = matches;
    }
  });

  // Extract potential keywords (nouns)
  const nouns = tokens.filter(token => {
    // Simple heuristic - words longer than 3 chars that aren't in stopwords
    return token.length > 3 && !natural.stopwords.includes(token);
  });
  
  if (nouns.length) {
    entities.keywords = nouns;
  }

  return entities;
}

  // Add words to spellcheck dictionary
  addWords(words) {
    if (!this.spellcheck) return;
    words.forEach(word => {
      if (!this.spellcheck.dictionary.includes(word)) {
        this.spellcheck.dictionary.push(word);
      }
    });
  }
}

module.exports = { NLProcessor };