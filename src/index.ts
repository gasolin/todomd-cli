#!/usr/bin/env node

import React from 'react';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';
import { pathToFileURL } from 'url';
import AppLoader from './components/AppLoader.js';

// Load environment variables
dotenv.config();

async function main() {
  const { default: meow } = await import('meow');
  const { render } = await import('ink');

  const cli = meow(
    `
    Usage
      $ todomd <command> [options]

    Commands
      list, ls              List all tasks
      add <task>            Add a new task
      done <id>             Mark task as completed
      undone <id>           Mark task as incomplete
      delete, rm <id>       Delete a task
      edit <id>             Edit a task
      priority, pri <id> <priority>  Set task priority
      project, proj <task> <project>  Add project to task
      context, ctx <task> <context>   Add context to task
      search <term>         Search tasks
      due <id> <date>       Set due date
      init                  Initialize todomd directory

    Options
      --file, -f            Specify todomd file (default: todo.md)
      --done-file           Specify done file (default: done.md)
      --help                Show help
      --version             Show version

    Examples
      $ todomd add "Buy groceries @home +personal"
      $ todomd done 1
      $ todomd list
      $ todomd priority 1 A
      $ todomd search "groceries"
  `,
    {
      // @ts-ignore
      importMeta: { url: pathToFileURL(__filename).href },
      flags: {
        file: {
          type: 'string',
          shortFlag: 'f',
          default: 'todo.md',
        },
        doneFile: {
          type: 'string',
          default: 'done.md',
        },
      },
    }
  );

  // Get TODO_DIR from environment or default to home directory
  const getTodoDir = (): string => {
    return process.env.TODO_DIR || path.join(os.homedir(), '.todomd');
  };

  render(React.createElement(AppLoader, {
    command: cli.input[0] || 'list',
    args: cli.input.slice(1),
    flags: cli.flags,
    todoDir: getTodoDir()
  }));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
