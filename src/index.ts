#!/usr/bin/env node

import React from 'react'
import meow from 'meow'
import dotenv from 'dotenv'
import path from 'path'
import os from 'os'
import App from './components/App.js'
import { pathToFileURL } from 'url'
import { ValidCommands } from './types/Commands.js'

// Load environment variables
dotenv.config()

const cli = meow(
  `
  Usage
    $ todomd <command> [options]
    $ todomd [path/to/your/todo.md] <command> [options]

  Commands
    list, ls                      List all tasks
    listall, lsa                  List all tasks (including completed and cancelled)
    add, a <task>                 Add a new task
    done, do <id>                 Mark task as completed
    undone, ud <id>               Mark task as incomplete
    delete, rm, del <id>          Delete a task
    edit <id>                     Edit a task
    priority, pri <id> <priority> Set task priority
    project, proj <task> <project> Add project to task
    context, ctx <task> <context>   Add context to task
    search <term>                 Search tasks
    due <id> <date>               Set due date
    init                          Initialize todomd directory
    archive                       Archive completed tasks

  Options
    --file, -f                    Specify todomd file (default: todo.md)
    --done-file                   Specify done file (default: done.md)
    --help                        Show help
    --version                     Show version

  Examples
    $ todomd add "Buy groceries @home +personal"
    $ todomd my-project/todo.md add "A new task for my project"
  `,
  {
    importMeta: { url: pathToFileURL(__filename).href },
    flags: {
      file: { type: 'string', shortFlag: 'f' },
      doneFile: { type: 'string' }
    }
  } as any
)

const todoDir = process.env.TODO_DIR || path.join(os.homedir(), '.todomd')

async function run() {
  const { render } = await import('ink')
  render(
    React.createElement(App, {
      command: cli.input[0] || ValidCommands.List,
      args: cli.input.slice(1),
      flags: cli.flags,
      todoDir: todoDir
    })
  )
}

run()
