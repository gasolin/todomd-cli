#!/usr/bin/env node

import React from 'react'
import meow from 'meow'
import dotenv from 'dotenv'
import path from 'path'
import os from 'os'
import App from './components/App.js'
import { pathToFileURL } from 'url'
import { ValidCommands } from './types/Commands.js'
import { Commander } from './lib/Commander.js'

// Load environment variables
dotenv.config({ quiet: true })

const cli = meow(
  `
  Usage
    $ todomd <command> [options]
    $ todomd [path/to/your/todo.md] <command> [options]

  Commands
    list, ls [search terms]       List all tasks, or filter by search terms
    listcon, lsc <context>        List tasks by context
    listpri, lsp <priority>       List tasks by priority
    listproj, lsproj <project>    List tasks by project
    add, a <task>                 Add a new task
    done, do <id>                 Mark task as completed
    undone, ud <id>               Mark task as incomplete
    cancel <id>                   Cancel a task
    inprogress <id>               Set a task as in progress
    delete, rm, del <id>          Delete a task
    edit <id>                     Edit a task
    priority, pri <id> <priority> Set task priority
    project, proj <task> <project> Add project to task
    context, ctx <task> <context>  Add context to task
    due <id> <date>               Set due date
    init                          Initialize todomd directory
    archive                       Archive completed tasks

  Options
    --file, -f                    Specify todomd file (default: todo.md)
    --done-file                   Specify done file (default: done.md)
    --json                        Output raw JSON (for list commands)
    --help                        Show help
    --version                     Show version

  Examples
    $ todomd add "Buy groceries @home +personal"
    $ todomd my-project/todo.md add "A new task for my project"

  Spec Reference
    https://github.com/gasolin/todomd/blob/main/spec.md
  `,
  {
    importMeta: { url: pathToFileURL(__filename).href },
    flags: {
      file: { type: 'string', shortFlag: 'f' },
      doneFile: { type: 'string' },
      json: { type: 'boolean' },
      help: { type: 'boolean', shortFlag: 'h' }
    }
  } as any
)

const todoDir = process.env.TODOMD_DIR || path.join(os.homedir(), '.todomd')

async function run() {
  const command = cli.input[0] || ValidCommands.List
  const args = cli.input.slice(1)

  if (cli.flags.json) {
    const commander = new Commander(
      todoDir,
      cli.flags.file as string,
      cli.flags.doneFile as string
    )
    try {
      const result = await commander.run(command, args)
      console.log(JSON.stringify(result, null, 2))
    } catch (err) {
      console.error(
        JSON.stringify(
          {
            error:
              err instanceof Error ? err.message : 'An unknown error occurred'
          },
          null,
          2
        )
      )
      process.exit(1)
    }
    return
  }

  const { render } = await import('ink')
  render(
    React.createElement(App, {
      command: command,
      args: args,
      flags: cli.flags,
      todoDir: todoDir
    }),
    { debug: false }
  )
}

run()
