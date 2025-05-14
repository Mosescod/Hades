const fs = require('fs');
const path = require('path');
const config = require('../config');

class MemoryManager {
  constructor(settings) {
    this.config = settings;
    this.memory = {
      shortTerm: [],
      longTerm: {},
      episodic: []
    };
    
    // Load persisted memory if enabled
    if (this.config.longTermPersistence) {
      this.loadPersistedMemory();
    }
    
    // Initialize with system defaults
    this.addLongTerm('system', {
      userPreferences: {},
      knownFacts: {},
      learnedBehaviors: []
    });
  }

  store(type, data, metadata = {}) {
    if (!this.memory[type]) {
      throw new Error(`Invalid memory type: ${type}`);
    }

    const entry = {
      data,
      timestamp: new Date().toISOString(),
      ...metadata
    };

    switch (type) {
      case 'shortTerm':
        this.memory.shortTerm.unshift(entry);
        if (this.memory.shortTerm.length > this.config.shortTermCapacity) {
          this.memory.shortTerm.pop();
        }
        break;

      case 'episodic':
        this.memory.episodic.unshift(entry);
        break;

      default:
        throw new Error(`Cannot store directly to ${type} memory`);
    }

    return entry;
  }

  addLongTerm(category, data) {
    if (!this.memory.longTerm[category]) {
      this.memory.longTerm[category] = {};
    }

    Object.assign(this.memory.longTerm[category], data);
    
    // Auto-persist if enabled
    if (this.config.longTermPersistence) {
      this.persistMemory();
    }

    return this.memory.longTerm[category];
  }

  recall(type, filterFn = null) {
    if (!this.memory[type]) {
      throw new Error(`Invalid memory type: ${type}`);
    }

    if (filterFn) {
      return this.memory[type].filter(filterFn);
    }
    return [...this.memory[type]];
  }

  getRecentSentimentAverage(count = 3) {
    const recent = this.memory.shortTerm
      .slice(0, count)
      .filter(entry => entry.data.sentiment !== undefined)
      .map(entry => entry.data.sentiment);

    if (recent.length === 0) return 0;
    return recent.reduce((sum, val) => sum + val, 0) / recent.length;
  }

  findRelatedMemories(query, type = 'episodic', threshold = 0.3) {
    // Simple keyword-based similarity search
    const queryTokens = query.toLowerCase().split(/\s+/);
    return this.memory[type].filter(entry => {
      const entryText = typeof entry.data === 'string' 
        ? entry.data 
        : JSON.stringify(entry.data);
      const entryTokens = entryText.toLowerCase().split(/\s+/);
      
      const intersection = queryTokens.filter(token => 
        entryTokens.includes(token)
      );
      
      return intersection.length / queryTokens.length >= threshold;
    });
  }

  persistMemory() {
    if (!this.config.longTermPersistence) return;

    try {
      fs.writeFileSync(
        path.resolve(__dirname, '..', this.config.persistenceFile),
        JSON.stringify(this.memory.longTerm, null, 2),
        'utf8'
      );
    } catch (err) {
      console.error('Memory persistence failed:', err);
    }
  }

  loadPersistedMemory() {
    try {
      const data = fs.readFileSync(
        path.resolve(__dirname, '..', this.config.persistenceFile),
        'utf8'
      );
      this.memory.longTerm = JSON.parse(data);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Memory load failed:', err);
      }
      // File doesn't exist yet - start fresh
      this.memory.longTerm = {};
    }
  }

  // Advanced memory operations
  summarizeRecent(count = 5) {
    const recent = this.memory.shortTerm.slice(0, count);
    return recent.map(entry => ({
      time: entry.timestamp,
      summary: typeof entry.data === 'string'
        ? entry.data.substring(0, 50) + '...'
        : 'Data entry'
    }));
  }
}

module.exports = { MemoryManager };