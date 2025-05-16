const natural = require('natural');
const { SentimentAnalyzer } = natural;
const stemmer = natural.PorterStemmer;

class ResponseBlender {
  constructor() {
    this.analyzer = new SentimentAnalyzer('English', stemmer, 'afinn');
    this.tokenizer = new natural.WordTokenizer();
  }

  blendResponses(primaryResp, secondaryResp, context) {
    // Calculate blend ratio based on context
    const blendRatio = this._calculateBlendRatio(
      primaryResp, 
      secondaryResp, 
      context
    );

    // Skip blending if ratio too low
    if (blendRatio < 0.3) return primaryResp;

    // Structural blending
    const blended = {
      response: this._blendText(
        primaryResp.response, 
        secondaryResp.response, 
        blendRatio
      ),
      topic: `${primaryResp.topic}+${secondaryResp.topic}`,
      solutions: [
        ...new Set([
          ...(primaryResp.solutions || []),
          ...(secondaryResp.solutions || [])
        ])
      ],
      metadata: {
        blendRatio,
        components: [primaryResp.topic, secondaryResp.topic],
        sentiment: (primaryResp.metadata?.sentiment || 0) * blendRatio +
                 (secondaryResp.metadata?.sentiment || 0) * (1 - blendRatio)
      }
    };

    return blended;
  }

  _calculateBlendRatio(primary, secondary, context) {
    let ratio = 0.5; // Base ratio
    
    // Adjust based on topic priority
    const primaryTopic = context.topics.get(primary.topic);
    const secondaryTopic = context.topics.get(secondary.topic);
    if (primaryTopic && secondaryTopic) {
      ratio = primaryTopic.priority / 
             (primaryTopic.priority + secondaryTopic.priority);
    }

    // Adjust based on context relevance
    if (context.activeTopics) {
      const primaryInContext = context.activeTopics.includes(primary.topic);
      const secondaryInContext = context.activeTopics.includes(secondary.topic);
      
      if (primaryInContext && !secondaryInContext) ratio += 0.2;
      if (!primaryInContext && secondaryInContext) ratio -= 0.2;
    }

    // Adjust based on sentiment alignment
    const sentimentDiff = Math.abs(
      (primary.metadata?.sentiment || 0) - 
      (secondary.metadata?.sentiment || 0)
    );
    if (sentimentDiff > 1) ratio = Math.min(0.8, ratio);

    return Math.max(0.2, Math.min(0.8, ratio)); // Keep within bounds
  }

  _blendText(textA, textB, ratio) {
    const sentencesA = this._splitSentences(textA);
    const sentencesB = this._splitSentences(textB);
    
    // Simple blending - alternate sentences
    if (sentencesA.length + sentencesB.length <= 4) {
      const blended = [];
      const maxLen = Math.max(sentencesA.length, sentencesB.length);
      
      for (let i = 0; i < maxLen; i++) {
        if (i < sentencesA.length && Math.random() < ratio) {
          blended.push(sentencesA[i]);
        }
        if (i < sentencesB.length && Math.random() > ratio) {
          blended.push(sentencesB[i]);
        }
      }
      
      return blended.join(' ');
    }
    
    // More complex blending for longer texts
    return this._semanticBlend(textA, textB, ratio);
  }

  _semanticBlend(textA, textB, ratio) {
    const tokensA = this.tokenizer.tokenize(textA);
    const tokensB = this.tokenizer.tokenize(textB);
    
    // Create combined token pool
    const combined = [];
    const aCount = Math.floor(tokensA.length * ratio);
    const bCount = tokensB.length - aCount;
    
    // Take proportional tokens from each
    combined.push(...this._selectTokens(tokensA, aCount));
    combined.push(...this._selectTokens(tokensB, bCount));
    
    // Reconstruct text
    return this._reconstructSentence(combined);
  }

  _selectTokens(tokens, count) {
    if (count >= tokens.length) return tokens;
    
    // Select important tokens first (nouns, verbs)
    const important = tokens.filter((_, i) => 
      i % 3 === 0 || i > tokens.length / 2
    );
    
    return important.slice(0, count) || tokens.slice(0, count);
  }

  _reconstructSentence(tokens) {
    // Simple reconstruction - proper NLP would be better
    if (tokens.length === 0) return '';
    
    let sentence = tokens[0].charAt(0).toUpperCase() + tokens[0].slice(1);
    
    for (let i = 1; i < tokens.length; i++) {
      sentence += (i % 5 === 0 ? ', ' : ' ') + tokens[i];
    }
    
    return sentence + (tokens.length > 3 ? '.' : '');
  }

  _splitSentences(text) {
    return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  }
}

module.exports = {ResponseBlender};