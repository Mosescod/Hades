module.exports = {
  name: "sports_nutrition",
  description: "Handles diet and nutrition for athletes",
  keywords: ["food", "diet", "eat", "nutrition", "energy", "meal"],
  
  patterns: [
    {
      regex: /(food|eat|diet).*(competition|tournament)/i,
      responses: [
        "Competition nutrition is key. %solution",
        "For event eating: %solution",
        "Athletes should consider: %solution"
      ]
    },
    {
      regex: /(energy|fuel).*(low|lack)/i,
      responses: [
        "Energy management matters. %solution",
        "For better fueling: %solution",
        "Try this nutrition approach: %solution"
      ]
    },
    {
      regex: /(cheap|affordable).*(food|meals)/i,
      responses: [
        "Budget-friendly nutrition: %solution",
        "Eating well on a budget: %solution",
        "Try these cost-effective options: %solution"
      ]
    }
  ],
  
  solutions: [
    "meal prepping in bulk",
    "balanced plate method (carbs+protein+veg)",
    "hydration tracking",
    "energy-dense snacks",
    "seasonal produce focus",
    "post-workout recovery meals"
  ],

  crossTopicHandlers: {
    "personal_finance": (input, context) => {
      if (input.match(/(money|budget).*(food|eat|nutrition)/i)) {
        return {
          response: "Nutrition on a budget is possible:\n" +
                   "1. Bulk whole foods (rice, beans, oats)\n" +
                   "2. Seasonal produce\n" +
                   "3. Water instead of sports drinks\n" +
                   "Need specific meal ideas?",
          solutions: [
            "bean-based meals",
            "frozen vegetable mixes",
            "homemade energy bars"
          ]
        };
      }
      return null;
    }
  }
};