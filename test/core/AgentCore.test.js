const assert = require('assert');
const { HadesAgent } = require('../../lib/core/AgentCore');

describe('AgentCore', () => {
  let agent;

  before(() => {
    agent = new HadesAgent({
      debug: false,
      topicsDirectory: './test/fixtures/topics'
    });
  });

  it('should load topics', () => {
    assert(agent.topics.size > 0);
  });

  it('should process basic input', async () => {
    const response = await agent.processInput("Hello");
    assert(typeof response.response === 'string');
  });

  it('should handle actions', async () => {
    const response = await agent.processInput("help");
    assert(response.response.includes('commands'));
  });
});