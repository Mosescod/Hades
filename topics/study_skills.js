const { Topic } = require('../core/Topic');

class StudySkillsTopic extends Topic {
  constructor() {
    super({
      name: "study_skills",
      description: "Helps with learning techniques and academic success",
      keywords: ["study", "learn", "exam", "test", "focus", "memory"],
      
      patterns: [
        {
          regex: /(improve|better) (memory|recall)/i,
          responses: [
            "Memory techniques include: %solution",
            "For better recall: %solution",
            "Try this method: %solution"
          ]
        },
        {
          regex: /(study|learn) (efficient|effectiv)/i,
          responses: [
            "Effective studying requires: %solution",
            "Study smarter with: %solution",
            "Research shows: %solution"
          ]
        }
      ],
      
      solutions: [
        "spaced repetition system",
        "active recall practice",
        "Pomodoro technique (25/5)",
        "Feynman technique",
        "interleaved practice"
      ],
      
      solutionExplanations: {
        "spaced repetition": "Review material at increasing intervals",
        "Feynman technique": "Teach concepts simply to identify gaps"
      },
      
      subjectSpecific: {
        "math": "Practice problems > passive reading",
        "history": "Create timelines and causal chains"
      }
    });
  }

  generateResponse(input, matchResult, context) {
    // Check for subject-specific queries
    const subjectMatch = input.match(/math|history|science|literature/i);
    if (subjectMatch) {
      const subject = subjectMatch[0].toLowerCase();
      if (this.config.subjectSpecific[subject]) {
        return {
          response: `For ${subject}: ${this.config.subjectSpecific[subject]}. Also consider: %solution`,
          topic: this.name,
          solutions: this.config.solutions
        };
      }
    }
    return super.generateResponse(input, matchResult, context);
  }
}

module.exports = StudySkillsTopic;