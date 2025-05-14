module.exports = {
  name: "personal_finance",
  description: "Handles money management and financial stress topics",
  keywords: ["money", "finance", "debt", "savings", "broke", "income", "spend"],
  
  patterns: [
    {
      regex: /(no|low|out of|need) money/i,
      responses: [
        "Financial stress is common. %solution might help.",
        "When funds are low, consider %solution.",
        "For money issues, %solution could be useful."
      ]
    },
    {
      regex: /(make|earn|need) (more|extra) money/i,
      responses: [
        "Increasing income is important. %solution",
        "To earn more: %solution",
        "Here are ways to boost income: %solution"
      ]
    },
    {
      regex: /(spend|spending) (more|too much)/i,
      responses: [
        "Managing expenses is crucial. %solution",
        "For spending control: %solution",
        "Try this spending strategy: %solution"
      ]
    },
    {
      regex: /(financial|money) (stress|anxiety|worr)/i,
      responses: [
        "Money worries can be overwhelming. %solution",
        "When stressed about finances: %solution",
        "To reduce financial anxiety: %solution"
      ]
    }
  ],
  
  solutions: [
    "tracking all expenses for a week",
    "creating a 50-30-20 budget plan",
    "setting up automatic savings transfers",
    "exploring side gigs like freelancing",
    "using cash envelopes for spending categories",
    "negotiating bills and subscriptions"
  ],

  solutionExplanations: {
    "50-30-20 budget plan": "Allocate 50% to needs, 30% to wants, and 20% to savings/debt repayment.",
    "cash envelopes system": "Withdraw budgeted amounts in cash for each spending category to control overspending."
  },

  crossTopicHandlers: {
    "sports_performance": (input, context) => {
      if (input.match(/(money|finance).*(tournament|competition|train)/i)) {
        return {
          response: "I understand financial stress affects your sports preparation. Consider:\n" +
                   "1. Prioritizing essential tournament expenses\n" +
                   "2. Finding low-cost training alternatives\n" +
                   "3. Budgeting specifically for sports needs\n" +
                   "Which would help most right now?",
          solutions: [
            "public training facilities",
            "equipment sharing with teammates",
            "sports-specific budget category"
          ]
        };
      }
      return null;
    }
  },

  updateProfile: (input, profile) => {
    const amountMatch = input.match(/\$?(\d{3,})/);
    if (amountMatch) {
      return { incomeRange: parseInt(amountMatch[1]) > 2000 ? "medium" : "low" };
    }
    return {};
  },

  deepKnowledge: {
    "budgeting": {
      explanation: "Budgeting means planning how to allocate your income to expenses, savings, and debt repayment."
    }
  }
};