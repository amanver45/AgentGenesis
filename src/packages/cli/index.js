#!/usr/bin/env node

import { program } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(
  chalk.yellow(figlet.textSync('AgentGenesis', { horizontalLayout: 'full' })),
);

program.version('1.0.0').description('My Node CLI');

program
  .command('add <component>')
  .description('Add a specified component inside the utils/agentgenesis folder')
  .action(async (component) => {
    const { rootPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'rootPath',
        message: 'What is the root path of your project?',
        default: process.cwd(),
        validate: (input) => {
          if (fs.existsSync(input)) {
            return true;
          }
          return 'The path you entered does not exist. Please enter a valid path.';
        },
      },
    ]);

    if (component === 'calculatortool') {
      let exprevalInstalled = false;
      try {
        require.resolve(path.join(rootPath, 'node_modules', 'expr-eval'));
        exprevalInstalled = true;
      } catch (err) {
        exprevalInstalled = false;
      }

      if (!exprevalInstalled) {
        const { installexpreval } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'installexpreval',
            message:
              "'calculatortool' requires 'expr-eval'. Would you like to install it now?",
            default: true,
          },
        ]);

        if (installexpreval) {
          const spinner = ora('Installing expr-eval...').start();
          try {
            execSync(`npm install expr-eval`, {
              stdio: 'inherit',
              cwd: rootPath,
            });
            spinner.succeed('Successfully installed expr-eval.');
          } catch (error) {
            spinner.fail(`Failed to install expr-eval: ${error.message}`);
            return;
          }
        } else {
          console.log(
            chalk.red(
              "'searchapitool' cannot be added without 'expr-eval'. Please install it and try again.",
            ),
          );
          return;
        }
      }
    }
    if (component === 'chatOpenAI') {
      let openaiInstalled = false;
      try {
        require.resolve(path.join(rootPath, 'node_modules', 'openai'));
        openaiInstalled = true;
      } catch (err) {
        openaiInstalled = false;
      }

      if (!openaiInstalled) {
        const { installopenai } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'installopenai',
            message:
              "'chatOpenAI' requires 'openai'. Would you like to install it now?",
            default: true,
          },
        ]);

        if (installopenai) {
          const spinner = ora('Installing openai...').start();
          try {
            execSync(`npm install openai`, {
              stdio: 'inherit',
              cwd: rootPath,
            });
            spinner.succeed('Successfully installed openai.');
          } catch (error) {
            spinner.fail(`Failed to install openai: ${error.message}`);
            return;
          }
        } else {
          console.log(
            chalk.red(
              "'ChatOpenAi' cannot be added without 'openai'. Please install it and try again.",
            ),
          );
          return;
        }
      }
    }

    const utilsPath = path.join(rootPath, 'utils');
    const agentGenesisPath = path.join(utilsPath, 'agentgenesis');
    const componentFilePath = path.join(agentGenesisPath, `${component}.ts`);
    const templateFilePath = path.join(
      __dirname,
      'components',
      `${component}.ts`,
    );

    const spinner = ora(`Adding ${component} to your project...`).start();

    try {
      if (!fs.existsSync(templateFilePath)) {
        spinner.fail(`Template for '${component}' not found.`);
        return;
      }

      if (!fs.existsSync(utilsPath)) {
        fs.mkdirSync(utilsPath);
        spinner.succeed(`Created 'utils' folder at ${utilsPath}.`);
      }
      if (!fs.existsSync(agentGenesisPath)) {
        fs.mkdirSync(agentGenesisPath);
        spinner.succeed(
          `Created 'agentgenesis' folder at ${agentGenesisPath}.`,
        );
      }

      const templateContent = fs.readFileSync(templateFilePath, 'utf-8');

      if (!fs.existsSync(componentFilePath)) {
        fs.writeFileSync(componentFilePath, templateContent);
        spinner.succeed(`Created '${component}.ts' at ${componentFilePath}.`);
      } else {
        spinner.warn(
          `'${component}.ts' already exists at ${componentFilePath}.`,
        );
      }
    } catch (error) {
      spinner.fail(`Failed to add ${component}: ${error.message}`);
    }
  });

program.parse(process.argv);
