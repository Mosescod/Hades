module.exports = {
  conversation: {
    historyLength: 20,
    responseTimeout: 5000,
    maxTopicsActive: 3
  },
  nlp: {
    enableSpellcheck: true,
    enableSentiment: true,
    enableStemming: true
  },
  memory: {
    shortTermCapacity: 10,
    longTermPersistence: true,
    persistenceFile: './memory.json'
  }
};