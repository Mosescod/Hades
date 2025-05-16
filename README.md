# Hades AI - Conversational AI Agent

![Hades Logo](https://github.com/Mosescod/Hades/blob/main/docs/hades%20banner%20first.png) 


[![npm version](https://img.shields.io/npm/v/hades-ai.svg)](https://www.npmjs.com/package/hades-ai)
[![Build Status](https://img.shields.io/travis/yourusername/hades-ai/main.svg)](https://travis-ci.org/yourusername/hades-ai)
[![Coverage Status](https://coveralls.io/repos/github/yourusername/hades-ai/badge.svg)](https://coveralls.io/github/yourusername/hades-ai)

A sophisticated conversational AI agent that uses dynamic topic matching and context-aware responses. Perfect for building:
- Intelligent chatbots 💬
- Customer support systems 🛠️
- Therapeutic assistants 🧠
- Educational tools 📚

## Features

- 🧩 **Topic-based conversations** - Natural dialogue flow between subjects
- 🧠 **Context awareness** - Remembers conversation history
- 📊 **Sentiment analysis** - Adapts tone based on emotional cues
- 🔍 **Advanced NLP** - Stemming, pattern matching, entity extraction
- 💾 **Memory system** - Short-term and long-term recall
- ⚡ **Easy integration** - Works as CLI, library, or web service

## Installation

### As a global CLI tool
```bash
npm install -g hades-ai
hades  # Start interactive chat
```

```bash
npm install hades-ai
```

```bash
git clone https://github.com/mosescod/hades.git
cd hades
npm install
npm link  # For local development
```

``` 
const { HadesAgent } = require('hades-ai');

const agent = new HadesAgent();

// Simple query
agent.processInput("How to budget my money?").then(response => {
  console.log(response);
});

// Interactive CLI
require('hades-ai/bin/hades');
```

```
Usage: hades [input]

Options:
  -v, --version      Output current version
  -d, --debug        Enable debug mode
  --topics <path>    Specify custom topics directory

Examples:
  hades "How do I cook pasta?"  # Single query
  hades                         # Interactive mode
  ```

## Contributing
Fork the repository

Create your feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add some amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

## License
MIT © mosescod