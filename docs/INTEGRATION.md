# Hades AI Integration Guide

## Node.js Application
```javascript
const { HadesAgent } = require('hades-ai');

const agent = new HadesAgent({
  topicsDirectory: './custom-topics', // Optional custom topics path
  nlp: { enableSentiment: true }     // Enable sentiment analysis
});

// Process input
agent.processInput("I need help with budgeting").then(response => {
  console.log(response);
});