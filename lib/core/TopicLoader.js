const fs = require('fs');
const path = require('path');
const { Topic } = require('./Topic'); // Import Topic class

class TopicLoader {
  constructor({ debug = false } = {}) {
    this.debug = debug;
  }

  loadTopicsFromDirectory(dirPath) {
    const absolutePath = path.resolve(dirPath);
    const topics = new Map(); // Initialize as Map

    if (!fs.existsSync(absolutePath)) {
      console.error(`Topics directory not found: ${absolutePath}`);
      return topics;
    }

    fs.readdirSync(absolutePath)
      .filter(file => file.endsWith('.js'))
      .forEach(file => {
        try {
          const filePath = path.join(absolutePath, file);
          delete require.cache[require.resolve(filePath)];
          
          const module = require(filePath);
          const loaded = this._loadTopic(module, file);
          
          if (loaded) {
            if (Array.isArray(loaded)) {
              loaded.forEach(topic => topics.set(topic.name, topic));
            } else {
              topics.set(loaded.name, loaded);
            }
            console.log(`✓ Loaded topic: ${loaded.name} from ${file}`);
          }
        } catch (err) {
          console.error(`× Error loading ${file}:`, err.message);
        }
      });

    return topics;
  }

  _loadTopic(module, filename) {
    try {
      // Handle default class export
      if (typeof module === 'function' && module.prototype instanceof Topic) {
        return new module();
      }
      
      // Handle named class export
      const classExport = Object.values(module).find(
        exp => typeof exp === 'function' && exp.prototype instanceof Topic
      );
      if (classExport) return new classExport();

      // Handle config object
      if (typeof module === 'object' && module.name) {
        return new Topic(module);
      }

      throw new Error(`Invalid topic format in ${filename}`);
    } catch (err) {
      console.error(`Topic instantiation error in ${filename}:`, err.message);
      return null;
    }
  }
}

module.exports = { TopicLoader };