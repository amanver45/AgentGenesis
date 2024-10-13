#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Define the types for prompts
interface PromptAnswers {
  rootPath?: string;
  installexpreval?: boolean;
  installopenai?: boolean;
  installgeminiai?: boolean;
}

// Get __dirname and __filename equivalents in ESM
const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = dirname(__filename);

// Display the banner
console.log(
  chalk.yellow(figlet.textSync('AgentGenesis', { horizontalLayout: 'full' })),
);

// Initialize Commander
const program = new Command();

program.version('1.0.0').description('My Node CLI');

// Define the 'add' command
program
  .command('add <component>')
  .description('Add a specified component inside the utils/agentgenesis folder')
  .action(async (component: string) => {
    // Prompt for rootPath
    const questions = [
      {
        type: 'input',
        name: 'rootPath',
        message: 'What is the root path of your project?',
        default: process.cwd(),
        validate: (input: string) => {
          if (fs.existsSync(input)) {
            return true;
          }
          return 'The path you entered does not exist. Please enter a valid path.';
        },
      },
    ];
    //@ts-ignore
    const answers: PromptAnswers = await inquirer.prompt(questions);
    const rootPath: string = answers.rootPath as string;

    // Function to check if a module is installed
    const isModuleInstalled = (moduleName: string): boolean => {
      try {
        require.resolve(path.join(rootPath, 'node_modules', moduleName));
        return true;
      } catch {
        return false;
      }
    };

    // Function to prompt installation of a module
    const promptInstallModule = async (
      moduleName: string,
      displayName: string,
      installCommand: string,
    ): Promise<boolean> => {
      const { [`install${displayName}`]: install } = await inquirer.prompt([
        {
          type: 'confirm',
          name: `install${displayName}`,
          message: `'${displayName}' requires '${moduleName}'. Would you like to install it now?`,
          default: true,
        },
      ]);

      if (install) {
        const spinner = ora(`Installing ${moduleName}...`).start();
        try {
          execSync(installCommand, {
            stdio: 'inherit',
            cwd: rootPath,
          });
          spinner.succeed(`Successfully installed ${moduleName}.`);
          return true;
        } catch (error: any) {
          spinner.fail(`Failed to install ${moduleName}: ${error.message}`);
          return false;
        }
      } else {
        console.log(
          chalk.red(
            `'${displayName}' cannot be added without '${moduleName}'. Please install it and try again.`,
          ),
        );
        return false;
      }
    };
    const ensureAgentGenesisFaisal = async (): Promise<boolean> => {
      const moduleName = 'agentgenesisfaisal';
      if (!isModuleInstalled(moduleName)) {
        const { installAgentgenesisfaisal } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'installAgentgenesisfaisal',
            message: `'${moduleName}' is not installed. Would you like to install it now?`,
            default: true,
          },
        ]);

        if (installAgentgenesisfaisal) {
          const spinner = ora(`Installing ${moduleName}...`).start();
          try {
            execSync(`npm install ${moduleName}`, {
              stdio: 'inherit',
              cwd: rootPath,
            });
            spinner.succeed(`Successfully installed ${moduleName}.`);
            return true;
          } catch (error: any) {
            spinner.fail(`Failed to install ${moduleName}: ${error.message}`);
            return false;
          }
        } else {
          console.log(
            chalk.red(
              `Cannot proceed without '${moduleName}'. Please install it and try again.`,
            ),
          );
          return false;
        }
      }
      return true;
    };
    const agentGenesisInstalled = await ensureAgentGenesisFaisal();
    if (!agentGenesisInstalled) {
      return;
    }

    // Handle each component's dependencies
    switch (component) {
      case 'calculatortool':
        if (!isModuleInstalled('expr-eval')) {
          const installed = await promptInstallModule(
            'expr-eval',
            'expr-eval',
            'npm install expr-eval',
          );
          if (!installed) return;
        }
        break;

      case 'chatOpenAI':
      case 'openAIEmbeddings':
        if (!isModuleInstalled('openai')) {
          const installed = await promptInstallModule(
            'openai',
            'openai',
            'npm install openai',
          );
          if (!installed) return;
        }
        break;

      case 'chatAnthropic':
        if (!isModuleInstalled('@anthropic-ai/sdk')) {
          const installed = await promptInstallModule(
            '@anthropic-ai/sdk',
            '@anthropic-ai/sdk',
            'npm install @anthropic-ai/sdk',
          );
          if (!installed) return;
        }
        break;

      case 'chatGemini':
      case 'geminiEmbeddings':
        if (!isModuleInstalled('@google/generative-ai')) {
          const installed = await promptInstallModule(
            '@google/generative-ai',
            '@google/generative-ai',
            'npm install @google/generative-ai',
          );
          if (!installed) return;
        }
        break;

      case 'reranker':
        if (!isModuleInstalled('cohere-ai')) {
          const installed = await promptInstallModule(
            'cohere-ai',
            'reranker',
            'npm install -s cohere-ai',
          );
          if (!installed) return;
        }
        break;

      case 'unstructuredLoader':
        if (!isModuleInstalled('unstructured-client')) {
          const installed = await promptInstallModule(
            'unstructured-client',
            'unstructured-client',
            'npm install unstructured-client --include=dev',
          );
          if (!installed) return;
        }
        break;

      default:
        console.log(
          chalk.red(
            `Unknown component '${component}'. Please choose a valid component.`,
          ),
        );
        return;
    }

    // Paths for utils and agentgenesis directories
    const utilsPath: string = path.join(rootPath, 'utils');
    const agentGenesisPath: string = path.join(utilsPath, 'agentgenesis');
    const componentFilePath: string = path.join(
      agentGenesisPath,
      `${component}.ts`,
    );
    const templateFilePath: string = path.join(
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

      // Create 'utils' directory if it doesn't exist
      if (!fs.existsSync(utilsPath)) {
        fs.mkdirSync(utilsPath);
        spinner.succeed(`Created 'utils' folder at ${utilsPath}.`);
      }

      // Create 'agentgenesis' directory if it doesn't exist
      if (!fs.existsSync(agentGenesisPath)) {
        fs.mkdirSync(agentGenesisPath);
        spinner.succeed(
          `Created 'agentgenesis' folder at ${agentGenesisPath}.`,
        );
      }

      const templateContent: string = fs.readFileSync(
        templateFilePath,
        'utf-8',
      );

      if (!fs.existsSync(componentFilePath)) {
        fs.writeFileSync(componentFilePath, templateContent);
        spinner.succeed(`Created '${component}.ts' at ${componentFilePath}.`);
      } else {
        spinner.warn(
          `'${component}.ts' already exists at ${componentFilePath}.`,
        );
      }
    } catch (error: any) {
      spinner.fail(`Failed to add ${component}: ${error.message}`);
    }
  });

program.parse(process.argv);