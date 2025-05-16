const assert = require('assert');
const { HadesAgent } = require('../lib/core/AgentCore');
const { NLProcessor } = require('../lib/utils/nlp');

describe('Integration Tests', () => {
  let agent;

  before(() => {
    agent = new HadesAgent({
      debug: false,
      topicsDirectory: './test/fixtures/topics'
    });
  });

  it('should process multi-turn conversation', async () => {
    const response1 = await agent.processInput("I need financial advice");
    assert(response1.topic === 'personal_finance');
    
    const response2 = await agent.processInput("How to save money?");
    assert(response2.response.includes('budget'));
  });

  it('should maintain context', async () => {
    await agent.processInput("Let's talk about fitness");
    const response = await agent.processInput("What exercises?");
    assert(response.topic === 'fitness');
  });
});