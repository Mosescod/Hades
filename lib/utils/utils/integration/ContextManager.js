class ContextManager {
  constructor() {
    this.current = {
      phase: 'init', // init → explore → deep-dive → resolve → close
      activeTopics: [],
      emotionalState: 0,
      recentEntities: [],
      conversationThreads: []
    };
    
    this.profile = {
      demographics: {},
      preferences: {},
      learnedBehaviors: []
    };
    
    this.history = [];
    this.maxHistory = 20;
  }

  update(input, response) {
    // Update conversation phase
    this._updatePhase(input, response);
    
    // Update active topics
    this._updateActiveTopics(response.topic);
    
    // Update emotional state
    if (response.metadata?.sentiment) {
      this.current.emotionalState = this._calculateSmoothedSentiment(
        response.metadata.sentiment
      );
    }
    
    // Store in history
    this.history.unshift({
      input,
      response,
      timestamp: new Date(),
      contextSnapshot: { ...this.current }
    });
    
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }
  }

  _updatePhase(input, response) {
    const inputLength = input.split(/\s+/).length;
    const responseLength = response.response.split(/\s+/).length;
    
    if (this.current.phase === 'init') {
      if (inputLength > 8 || responseLength > 15) {
        this.current.phase = 'explore';
      }
    } 
    else if (this.current.phase === 'explore') {
      if (this.current.activeTopics.length > 0) {
        this.current.phase = 'deep-dive';
      }
    }
    else if (this.current.phase === 'deep-dive') {
      if (response.metadata?.blendRatio && response.metadata.blendRatio > 0.6) {
        this.current.phase = 'resolve';
      }
    }
  }

  _updateActiveTopics(newTopic) {
    if (!newTopic) return;
    
    // Handle blended topics
    if (newTopic.includes('+')) {
      newTopic.split('+').forEach(topic => {
        this._addActiveTopic(topic);
      });
    } else {
      this._addActiveTopic(newTopic);
    }
    
    // Limit active topics
    if (this.current.activeTopics.length > 3) {
      this.current.activeTopics.pop();
    }
  }

  _addActiveTopic(topic) {
    const existingIndex = this.current.activeTopics.indexOf(topic);
    if (existingIndex >= 0) {
      // Move to front if already exists
      this.current.activeTopics.splice(existingIndex, 1);
    }
    this.current.activeTopics.unshift(topic);
  }

  _calculateSmoothedSentiment(newSentiment) {
    // Weighted average with previous values
    if (this.history.length > 0) {
      const prevSentiment = this.history
        .slice(0, 3)
        .reduce((sum, item) => sum + (item.response.metadata?.sentiment || 0), 0) /
        Math.min(3, this.history.length);
      
      return (prevSentiment * 0.6 + newSentiment * 0.4);
    }
    return newSentiment;
  }

  getRelevantContext() {
    const recentTopics = this.current.activeTopics;
    const recentEntities = this._extractRecentEntities();
    
    return {
      activeTopics: [...recentTopics],
      emotionalState: this.current.emotionalState,
      entities: [...recentEntities],
      phase: this.current.phase,
      threads: this._detectThreads()
    };
  }

  _extractRecentEntities() {
    const entities = new Set();
    
    // Get entities from last 5 turns
    this.history.slice(0, 5).forEach(entry => {
      if (entry.response.metadata?.entities) {
        entry.response.metadata.entities.forEach(e => entities.add(e));
      }
    });
    
    return Array.from(entities);
  }

  _detectThreads() {
    const threads = [];
    let currentThread = [];
    
    this.history.forEach((entry, i) => {
      if (i === 0 || 
          entry.contextSnapshot.activeTopics.some(t => 
            currentThread.includes(t))) {
        currentThread.push(...entry.contextSnapshot.activeTopics);
      } else {
        if (currentThread.length > 0) {
          threads.push([...new Set(currentThread)]);
        }
        currentThread = [...entry.contextSnapshot.activeTopics];
      }
    });
    
    if (currentThread.length > 0) {
      threads.push([...new Set(currentThread)]);
    }
    
    return threads.slice(0, 3); // Return max 3 recent threads
  }
}

module.exports = { ContextManager };