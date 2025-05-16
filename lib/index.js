const chalk = require('chalk');
const readline = require('readline');
const HadesCore = require('./core/AgentCore');

// Initialize the agent
const hades = new HadesCore();

// Set up CLI interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(chalk.green.bold(`
  ██   ██  █████  ██████  ███████ ███████ 
  ██   ██ ██   ██ ██   ██ ██      ██      
  ███████ ███████ ██   ██ █████   █████   
  ██   ██ ██   ██ ██   ██ ██           ██      
  ██   ██ ██   ██ ██████  ███████ ███████ 
`));

console.log(chalk.yellow(
  `\nHADES AI Agent ready. Type ${chalk.cyan('help')} for options or ${chalk.cyan('exit')} to quit.\n`
));

// Start conversation loop
const chat = () => {
  rl.question(chalk.blue('You: '), async (input) => {
    if (input.toLowerCase().trim() === 'exit') {
      rl.close();
      return;
    }

    const result = await hades.processInput(input);
    
    console.log(chalk.magenta(
      `HADES [${result.topic || 'general'}]: ${result.response}\n`
    ));
    
    if (result.exit) {
      rl.close();
    } else {
      chat();
    }
  });
};

chat();