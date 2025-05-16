const { HadesAgent } = require('hades-ai');

const agent = new HadesAgent({
  nlp: { enableSentiment: true }
});

const testPhrases = [
  "I love this amazing product!",
  "This service is terrible and slow",
  "It's okay, nothing special"
];

async function analyze() {
  for (const phrase of testPhrases) {
    const response = await agent.processInput(phrase);
    console.log(`"${phrase}"`);
    console.log(`  Sentiment: ${response.metadata.sentiment.toFixed(2)}`);
    console.log(`  Response: ${response.response}\n`);
  }
}

analyze();