#!/usr/bin/env node
const HadesAgent = require('../lib/core/AgentCore');
const chalk = require('chalk');
const readline = require('readline');

const agent = new HadesAgent();

if (process.argv.length > 2) {
  // Single command mode
  const input = process.argv.slice(2).join(' ');
  agent.processInput(input).then(response => {
    console.log(chalk.magenta(`HADES: ${response.response}`));
    process.exit(0);
  });
} else {
  // Interactive mode
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(chalk.green.bold('HADES AI Agent (type "exit" to quit)\n'));
  
  const chat = () => {
    rl.question(chalk.blue('You: '), async (input) => {
      if (input.toLowerCase().trim() === 'exit') {
        rl.close();
        return;
      }

      const result = await agent.processInput(input);
      console.log(chalk.magenta(`HADES: ${result.response}\n`));
      chat();
    });
  };

  chat();
}