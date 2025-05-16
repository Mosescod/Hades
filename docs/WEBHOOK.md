
### webhook-integration.js
```javascript
const express = require('express');
const { HadesAgent } = require('../lib/core/AgentCore');
const bodyParser = require('body-parser');

const app = express();
const agent = new HadesAgent({
  nlp: { enableSentiment: true }
});

app.use(bodyParser.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { message, context = {} } = req.body;
    const response = await agent.processInput(message);
    
    res.json({
      reply: response.response,
      topic: response.topic,
      sentiment: response.metadata.sentiment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    topicsLoaded: agent.topics.size
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Hades webhook server running on port ${PORT}`);
});