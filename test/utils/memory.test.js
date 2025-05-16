const assert = require('assert');
const { MemoryManager } = require('../../lib/utils/memory');

describe('MemoryManager', () => {
  let memory;

  beforeEach(() => {
    memory = new MemoryManager();
  });

  it('should store and recall short-term memory', () => {
    memory.store('shortTerm', { input: 'test' });
    const recalled = memory.recall('shortTerm');
    assert(recalled.length === 1);
    assert(recalled[0].data.input === 'test');
  });

  it('should expire old memories', () => {
    memory.config.shortTermCapacity = 2;
    memory.store('shortTerm', { input: '1' });
    memory.store('shortTerm', { input: '2' });
    memory.store('shortTerm', { input: '3' });
    assert(memory.recall('shortTerm').length === 2);
  });
});