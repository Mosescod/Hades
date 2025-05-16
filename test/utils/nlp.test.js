const assert = require('assert');
const { NLProcessor } = require('../../lib/utils/nlp');

describe('NLProcessor', () => {
  let nlp;

  before(() => {
    nlp = new NLProcessor({
      enableSentiment: true,
      enableStemming: true
    });
  });

  it('should analyze sentiment', async () => {
    const positive = await nlp.process("I love this");
    assert(positive.sentiment > 0);

    const negative = await nlp.process("I hate this");
    assert(negative.sentiment < 0);
  });

  it('should tokenize text', async () => {
    const result = await nlp.process("Hello world");
    assert.deepStrictEqual(result.tokens, ['hello', 'world']);
  });
});