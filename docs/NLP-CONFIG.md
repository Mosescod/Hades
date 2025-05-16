
# NLP Configuration Guide

## Core Features
```javascript
const agent = new HadesAgent({
  nlp: {
    enableSentiment: true,    // Analyze emotional tone
    enableStemming: true,     // Improve keyword matching
    enableSpellcheck: false,  // Experimental
    customWords: ['hades']    // Add to dictionary
  }
});
