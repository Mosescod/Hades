const https = require('https');

class OpenRouterIntegration {
  constructor(config) {
    if (!config.apiKey) throw new Error('API key is required');
    
    this.config = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'HTTP-Referer': config.referer || process.env.OPENROUTER_DOMAIN,
        'X-Title': config.appName || 'hades-ai'
      },
      model: config.model || "anthropic/claude-3-opus",
      temperature: config.temperature || 0.7,
      max_tokens: config.max_tokens || 250,
      ...config
    };
  }

  async generateResponse(input, options = {}) {
    return new Promise((resolve, reject) => {
      const req = https.request(this.config, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 200) {
              resolve(response.choices[0].message.content);
            } else {
              reject(new Error(response.error?.message || 'Unknown API error'));
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      });

      req.on('error', reject);

      req.write(JSON.stringify({
        model: this.config.model,
        messages: [{
          role: "user",
          content: input
        }],
        ...options
      }));

      req.end();
    });
  }
}

module.exports = { OpenRouterIntegration };