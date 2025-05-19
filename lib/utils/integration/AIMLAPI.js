const https = require('https');

class AIMLAPIIntegration {
  constructor(config = {}) {
    if (!config.apiKey) throw new Error('AIMLAPI.com key required');
    
    this.config = {
      hostname: 'api.aimlapi.com',
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      timeout: config.timeout || 3000
    };
  }

  async generateResponse(input) {
    return new Promise((resolve, reject) => {
      const req = https.request(this.config, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response?.output || "I didn't understand that.");
          } catch (e) {
            reject(new Error(`API Parse Error: ${e.message}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(this.config.timeout, () => req.destroy(new Error('API Timeout')));
      
      req.write(JSON.stringify({ input }));
      req.end();
    });
  }
}

module.exports = { AIMLAPIIntegration };