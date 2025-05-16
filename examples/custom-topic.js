const { HadesAgent, Topic } = require('hades-ai');

// Create custom topic
const cookingTopic = new Topic({
  name: "cooking",
  keywords: ["recipe", "cook", "ingredients"],
  patterns: [{
    regex: /how (?:to|do I) cook (.*)/i,
    responses: [
      "For %1, try this: %solution",
      "Here's how to cook %1: %solution"
    ]
  }],
  solutions: [
    "Preheat oven to 350°F",
    "Sauté onions first for flavor"
  ]
});

// Create agent and add topic
const agent = new HadesAgent();
agent.topics.set("cooking", cookingTopic);

// Test it
agent.processInput("How do I cook pasta?").then(response => {
  console.log("Response:", response.response);
});