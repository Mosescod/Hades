# Creating Topics for Hades AI

## Basic Topic Structure
```javascript
module.exports = {
  name: "travel",
  keywords: ["flight", "vacation"],
  patterns: [{
    regex: /book a flight to (.*)/i,
    responses: ["Booking flight to %1..."]
  }]
};
```

## Advanced Features
- **Solutions**: 
  ```javascript
  solutions: ["Check airline websites", "Use flight comparison tools"]
  ```
- **Cross-topic handling**:
  ```javascript
  crossTopicHandlers: {
    finance: (input) => {
      if (input.includes("cheap")) return { response: "Try budget airlines" };
    }
  }
  ```