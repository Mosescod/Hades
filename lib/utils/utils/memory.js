const fs = require('fs');
const path = require('path');

class MemoryManager {
  constructor(config = {}) {
    this.config = {
      persistence: false,
      persistencePath: './data',
      persistenceFile: 'memory.json',
      shortTermCapacity: 20,
      ...config // User-provided config overrides defaults
    };
    this.memory = {
      shortTerm: [],
      longTerm: {},
      episodic: []
    };
    
    this.topicMemories = new Map();
    if (this.config.persistence) {
      this.loadPersistedMemories();
    }
  }

  // Enhanced store method with topic awareness
  store(type, data, metadata = {}) {
    const memoryItem = {
      data,
      timestamp: new Date(),
      ...metadata
    };
    
    // Add automatic sentiment tracking if available
    if (data?.analysis?.sentiment !== undefined) {
        metadata.sentiment = data.analysis.sentiment;
    }

    // Store in main memory
    switch (type) {
      case 'shortTerm':
        this.memory.shortTerm.unshift(memoryItem);
        if (this.memory.shortTerm.length > this.config.shortTermCapacity) {
          this.memory.shortTerm.pop();
        }
        break;
        
      case 'episodic':
        this.memory.episodic.unshift(memoryItem);
        break;
        
      default:
        throw new Error(`Invalid memory type: ${type}`);
    }

    // Store in topic-specific memory if available
    if (metadata.topic) {
      if (!this.topicMemories.has(metadata.topic)) {
        this.topicMemories.set(metadata.topic, []);
      }
      this.topicMemories.get(metadata.topic).unshift({
        ...memoryItem,
        relevance: metadata.relevance || 1.0
      });
    }

    this.persistMemories();
  }

  // Enhanced recall with topic filtering
  recall(type, options = {}) {
    const {
      topic = null, 
      minRelevance = 0.3,
      maxItems = 5,
      filterFn = null
    } = options;

    // Get from topic-specific memory first
    if (topic && this.topicMemories.has(topic)) {
      let items = this.topicMemories.get(topic);
      if (filterFn) items = items.filter(filterFn);
      return items
        .filter(item => item.relevance >= minRelevance)
        .slice(0, maxItems);
    }

    // Fall back to main memory
    let items = [...this.memory[type] || []];
    if (filterFn) items = items.filter(filterFn);
    return items.slice(0, maxItems);
  }

  // Topic-weighted memory search
  findRelatedMemories(query, topics = [], options = {}) {
    const {
      minRelevance = 0.4,
      maxItems = 3
    } = options;

    // Get all candidate memories
    const candidates = [];
    
    // Add topic-specific memories first
    topics.forEach(topic => {
      if (this.topicMemories.has(topic)) {
        this.topicMemories.get(topic).forEach(item => {
          candidates.push({
            ...item,
            topic,
            combinedRelevance: item.relevance * 1.2 // Boost topic memories
          });
        });
      }
    });

    // Add general episodic memories
    this.memory.episodic.forEach(item => {
      candidates.push({
        ...item,
        topic: item.metadata?.topic || 'general',
        combinedRelevance: item.relevance || 0.8
      });
    });

    // Simple keyword matching (would use embeddings in production)
    const queryTokens = new Set(query.toLowerCase().split(/\s+/));
    const scored = candidates.map(item => {
      const text = typeof item.data === 'string' ? 
        item.data : 
        JSON.stringify(item.data);
      const tokens = new Set(text.toLowerCase().split(/\s+/));
      
      const intersection = new Set(
        [...queryTokens].filter(t => tokens.has(t))
      );
      
      const score = (intersection.size / queryTokens.size) * item.combinedRelevance;
      return { ...item, score };
    });

    return scored
      .filter(item => item.score >= minRelevance)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems);
  }

  // ... (other existing methods with topic integration) ...

  persistMemories() {
    if (!this.config.persistence) return;
    
    try {
      const data = {
        longTerm: this.memory.longTerm,
        topicMemories: Array.from(this.topicMemories.entries())
      };
      
      fs.writeFileSync(
        path.resolve(this.config.persistencePath, 'memory.json'),
        JSON.stringify(data, null, 2),
        'utf8'
      );
    } catch (err) {
      console.error('Memory persistence error:', err);
    }
  }

  loadPersistedMemories() {
    if (!this.config.persistence) return;
    
    try {
      const data = fs.readFileSync(
        path.resolve(this.config.persistencePath, 'memory.json'),
        'utf8'
      );
      const parsed = JSON.parse(data);
      
      this.memory.longTerm = parsed.longTerm || {};
      this.topicMemories = new Map(parsed.topicMemories || []);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error('Memory load error:', err);
      }
    }
  }

  getRecentSentimentAverage(count = 3) {
    // Get recent sentiment values from short-term memory
    const recentEntries = this.recall('shortTerm', {
        maxItems: count,
        filterFn: item => item.data?.analysis?.sentiment !== undefined
    });

    if (recentEntries.length === 0) return 0;

    // Calculate average sentiment
    const sum = recentEntries.reduce((total, entry) => {
        return total + (entry.data.analysis.sentiment || 0);
    }, 0);

    return sum / recentEntries.length;
  }

}

module.exports = {MemoryManager};