const path = require('path');

module.exports = {
  nlp: {
    enableSpellcheck: true,
    enableSentiment: true,
    enableStemming: true
  },
  memory: {
    shortTermCapacity: 10,
    longTermPersistence: true,
    persistencePath: path.join(__dirname, 'data') // Fixed path resolution
  },
  integration: {
    topicBlending: true,
    maxRelatedSuggestions: 2,
    memoryRecallWeight: 0.3
  },
  conversation: {
        maxTopicsActive: 3,
        minMatchScore: 0.5 // Lower threshold
  }
};