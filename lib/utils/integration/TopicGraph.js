const chalk = require('chalk');

class TopicGraph {
  constructor() {
    this.graph = new Map();
    this.keywordIndex = new Map();
  }

  addTopic(topic) {
    // Initialize node if not exists
    if (!this.graph.has(topic.name)) {
      this.graph.set(topic.name, new Set());
    }
    

    // Index keywords for auto-relations
    topic.keywords.forEach(keyword => {
      if (!this.keywordIndex.has(keyword)) {
        this.keywordIndex.set(keyword, new Set());
      }
      this.keywordIndex.get(keyword).add(topic.name);
    });

    // Process declared relationships
    if (topic.relatedTopics) {
      topic.relatedTopics.forEach(relatedName => {
        this._addRelation(topic.name, relatedName, 'declared');
      });
    }
  }

  _addRelation(topicA, topicB, type = 'auto') {
    // Ensure both nodes exist
    if (!this.graph.has(topicA)) return;
    if (!this.graph.has(topicB)) return;

    // Add bidirectional connection
    this.graph.get(topicA).edges.add({
      target: topicB,
      type,
      strength: type === 'declared' ? 1.0 : 0.6
    });
    
    this.graph.get(topicB).edges.add({
      target: topicA,
      type,
      strength: type === 'declared' ? 1.0 : 0.6
    });

    // Update node strength
    this.graph.get(topicA).strength += 0.1;
    this.graph.get(topicB).strength += 0.1;
  }

  buildAutoRelations() {
    // Create relations based on shared keywords
    this.keywordIndex.forEach((topics, keyword) => {
      if (topics.size > 1) {
        const topicArray = Array.from(topics);
        for (let i = 0; i < topicArray.length; i++) {
          for (let j = i + 1; j < topicArray.length; j++) {
            this._addRelation(topicArray[i], topicArray[j], 'auto');
          }
        }
      }
    });
  }

  getRelatedTopics(topicName, context = {}) {
    if (!this.graph.has(topicName)) return [];
    
    const topicNode = this.graph.get(topicName);
    const related = Array.from(topicNode.edges)
      .filter(edge => {
        // Filter by context if available
        if (context.activeTopics) {
          return context.activeTopics.includes(edge.target);
        }
        return true;
      })
      .sort((a, b) => b.strength - a.strength)
      .map(edge => ({
        name: edge.target,
        strength: edge.strength,
        type: edge.type
      }));

    return related;
  }

  findBridgeTopics(topicA, topicB) {
    if (!this.graph.has(topicA) || !this.graph.has(topicB)) return [];
    
    // Simple pathfinding for topic connections
    const visited = new Set();
    const queue = [{ name: topicA, path: [] }];
    const bridges = [];

    while (queue.length > 0) {
      const current = queue.shift();
      
      if (current.name === topicB && current.path.length > 0) {
        bridges.push(current.path[0]); // Return first bridge
        continue;
      }

      if (!visited.has(current.name)) {
        visited.add(current.name);
        const neighbors = this.graph.get(current.name).edges;
        
        neighbors.forEach(edge => {
          if (!visited.has(edge.target)) {
            queue.push({
              name: edge.target,
              path: current.path.length < 1 ? 
                [edge.target] : 
                [...current.path]
            });
          }
        });
      }
    }

    return [...new Set(bridges)]; // Unique bridges
  }

  visualize() {
    let output = chalk.blue.bold("\nTopic Relationship Graph:\n");
    this.graph.forEach((node, name) => {
      output += chalk.green(`\n${name} (${node.edges.size} connections):\n`);
      Array.from(node.edges)
        .sort((a, b) => b.strength - a.strength)
        .forEach(edge => {
          output += `  → ${edge.target} [${chalk.yellow(edge.type)}:${edge.strength.toFixed(1)}]\n`;
        });
    });
    return output;
  }
}

module.exports = {TopicGraph};