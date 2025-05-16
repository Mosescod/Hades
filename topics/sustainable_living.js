const { Topic } = require('../core/Topic');

class SustainableLivingTopic extends Topic {
  constructor() {
    super({
      name: "sustainable_living",
      description: "Provides eco-friendly living and zero-waste strategies",
      keywords: ["eco", "sustainable", "recycle", "zero waste", "carbon", "green"],
      
      patterns: [
        {
          regex: /(reduce|lower) (carbon|waste)/i,
          responses: [
            "Effective %2 reduction: %solution",
            "Sustainable alternatives: %solution",
            "Eco-swaps: %solution"
          ]
        },
        {
          regex: /(start|begin) (compost|recycling)/i,
          responses: [
            "%2 initiation guide: %solution",
            "Beginner %2 tips: %solution",
            "Getting started: %solution"
          ]
        }
      ],
      
      solutions: [
        "meatless Mondays to reduce food emissions",
        "DIY cleaning products with vinegar/baking soda",
        "clothing swap parties instead of fast fashion",
        "rainwater harvesting system",
        "community solar panel initiative"
      ],
      
      impactCalculators: {
        "carbon": "Average household can save 2,000 lbs CO2/year",
        "water": "Low-flow fixtures save ~20,000 gal/year"
      },
      
      localResources: (zipCode) => ({
        "compost": `Find sites at www.compostnow.org/${zipCode}`,
        "recycling": `Guidelines at www.wm.com/${zipCode}-recycling`
      }),
      
      updateProfile: (input, profile) => {
        const zipMatch = input.match(/\b\d{5}\b/);
        return zipMatch ? { location: zipMatch[0] } : {};
      }
    });
  }

  generateResponse(input, matchResult, context) {
    // Add local resources if location known
    if (context.userProfile?.location) {
      const resources = this.config.localResources(context.userProfile.location);
      return {
        response: `${super.generateResponse(input, matchResult, context).response}\n\nLocal resources: ${resources.compost}`,
        topic: this.name
      };
    }
    
    // Add impact data for reduction queries
    if (input.match(/reduce|lower|cut/i)) {
      const impactType = input.match(/carbon|water|energy/i)?.[0] || 'carbon';
      return {
        response: `${super.generateResponse(input, matchResult, context).response}\n\nPotential impact: ${this.config.impactCalculators[impactType]}`,
        topic: this.name
      };
    }
    
    return super.generateResponse(input, matchResult, context);
  }
}

module.exports = SustainableLivingTopic;