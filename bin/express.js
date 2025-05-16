const express = require('express');
const { HadesAgent } = require('hades-ai');
const app = express();
const agent = new HadesAgent();

app.post('/chat', express.json(), async (req, res) => {
  const response = await agent.processInput(req.body.message);
  res.json({
    reply: response.response,
    topic: response.topic,
    sentiment: response.metadata?.sentiment
  });
});

app.listen(3000, () => console.log('Hades API running on port 3000'));