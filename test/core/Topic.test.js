const { Topic } = require('../../lib/core/Topic');
const assert = require('assert');

describe('Topic', () => {
  const financeTopic = new Topic({
    name: "personal_finance",
    keywords: ["money", "budget"],
    patterns: [{
      regex: /I need (?:help|advice) with (.*)/i,
      responses: ["For %1, try these steps: %solution"]
    }],
    solutions: ["Track your expenses"]
  });

  it('should match keyword "money"', () => {
    const match = financeTopic.match("I'm stressed about money");
    assert(match.score > 0.5);
  });

  it('should generate solution-based response', () => {
    const response = financeTopic.generateResponse(
      "I need help with savings",
      { pattern: financeTopic.patterns[0] }
    );
    assert(response.response.includes("Track your expenses"));
  });
});