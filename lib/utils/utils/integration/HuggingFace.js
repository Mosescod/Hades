const https = require('https');

class HuggingFaceIntegration {
  constructor(config) {
    if (!config.apiKey) throw new Error('API key is required');
    
    this.config = {
      hostname: 'api-inference.huggingface.co',
      path: '/models/' + (config.model || "mistralai/Mixtral-8x7B-Instruct-v0.1"),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
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
            if (res.statusCode === 403) {
              const error = new Error(`API Authentication Failed (403)`);
              error.details = data;
              reject(error);
              return;
            }
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const response = JSON.parse(data);
              if (Array.isArray(response) && response[0]?.generated_text) {
                resolve(response[0].generated_text.trim());
              } else if (response.generated_text) {
                resolve(response.generated_text.trim());
              } else {
                reject(new Error('Invalid API response format'));
              }
            } else {
              const error = new Error(`API Error: ${res.statusCode}`);
              error.statusCode = res.statusCode;
              error.response = data;
              reject(error);
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      try {
        const requestBody = JSON.stringify({
          inputs: `[INST] ${options.systemPrompt || "You are HADES, an AI assistant. Provide concise, factual answers."} [/INST]\n\n${input}`,
          parameters: {
            temperature: this.config.temperature,
            max_new_tokens: this.config.max_tokens
          }
        });

        if (this.config.debug) {
          console.log('Sending to HuggingFace API:', {
            endpoint: `https://${this.config.hostname}${this.config.path}`,
            headers: this.config.headers,
            body: requestBody
          });
        }

        req.write(requestBody);
        req.end();
      } catch (e) {
        reject(new Error(`Request failed: ${e.message}`));
      }
    });
  }
}

module.exports = { HuggingFaceIntegration };