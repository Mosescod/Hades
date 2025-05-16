
# Hades AI API Reference

## Core Classes

### `HadesAgent`
```javascript
new HadesAgent({
  debug: false,           // Enable debug logging
  topicsDirectory: './topics', // Path to topic files
  nlp: {                  // NLP configuration
    enableSentiment: true,
    enableSpellcheck: false
  }
})