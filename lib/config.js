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
    persistencePath: path.join(__dirname, 'data')
  },
  integration: {
    topicBlending: true,
    maxRelatedSuggestions: 2,
    memoryRecallWeight: 0.3,
    aiPriority: ['openai', 'deepseek', 'huggingface', 'groq', 'perplexity', 'openrouter', 'aimlapi'],
    aiRetryAttempts: 2,
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-4-turbo",
      temperature: 0.7,
      max_tokens: 250,
      top_p: 1,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    },
    deepseek: {
      apiKey: process.env.DEEPSEEK_API_KEY,
      model: "deepseek-chat",
      temperature: 0.7,
      max_tokens: 250
    },
    aimlapi: {  
      apiKey: process.env.AIMLAPI_KEY,
      timeout: 5000
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      model: "anthropic/claude-3-opus",
      temperature: 0.7,
      max_tokens: 250,
      appName: "hades-ai",
      referer: process.env.OPENROUTER_DOMAIN
    },
    huggingface: {
      apiKey: process.env.HUGGINGFACE_API_KEY,
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      temperature: 0.7,
      max_tokens: 250
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY,
      model: "llama3-70b-8192",
      temperature: 0.7,
      max_tokens: 250
    },
    perplexity: {
      apiKey: process.env.PERPLEXITY_API_KEY,
      model: "pplx-70b-online",
      temperature: 0.7,
      max_tokens: 250
    }
  },
  conversation: {
    maxTopicsActive: 3,
    minMatchScore: 0.5,
    aiCutoffScore: 0.3,
    enableBlending: true,
    maxChatHistory: 6
  }
};