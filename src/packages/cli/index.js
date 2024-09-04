#!/usr/bin/env node

import { program } from "commander";
import chalk from "chalk";
import figlet from "figlet";
import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import ora from "ora";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(
  chalk.yellow(figlet.textSync("AgentGenesis", { horizontalLayout: "full" }))
);

program
  .version("1.0.0")
  .description("My Node CLI");

program
  .command("add <component>")
  .description("Add a specified component inside the utils/agentgenesis folder")
  .action(async (component) => {
    const { projectType, rootPath } = await inquirer.prompt([
      {
        type: "list",
        name: "projectType",
        message: "Are you working on a Node.js, React, or Next.js project?",
        choices: ["Node.js", "React", "Next.js"],
      },
      {
        type: "input",
        name: "rootPath",
        message: "What is the root path of your project?",
        default: process.cwd(),  
        validate: (input) => {
          if (fs.existsSync(input)) {
            return true;
          }
          return "The path you entered does not exist. Please enter a valid path.";
        }
      },
    ]);

    console.log(chalk.blue(`Project Type: ${projectType}`));
    console.log(chalk.blue(`Root Path: ${rootPath}`));

    const utilsPath = path.join(rootPath, "utils");
    const agentGenesisPath = path.join(utilsPath, "agentgenesis");
    const componentFilePath = path.join(agentGenesisPath, `${component}.ts`);
    const templateFilePath = path.join(__dirname, "components", `${component}.ts`);

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
        spinner.succeed(`Created 'agentgenesis' folder at ${agentGenesisPath}.`);
      }

      const templateContent = fs.readFileSync(templateFilePath, "utf-8");

      if (!fs.existsSync(componentFilePath)) {
        fs.writeFileSync(componentFilePath, templateContent);
        spinner.succeed(`Created '${component}.ts' at ${componentFilePath}.`);
      } else {
        spinner.warn(`'${component}.ts' already exists at ${componentFilePath}.`);
      }
    } catch (error) {
      spinner.fail(`Failed to add ${component}: ${error.message}`);
    }
  });

program.parse(process.argv);