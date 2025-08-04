import { TodoManager } from './TodoManager'
import { Task, Status } from '../types/Task'
import { ValidCommands } from '../types/Commands'
import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'
import os from 'os'

export class Commander {
  private todoDir: string
  private todoFile: string | undefined
  private doneFile: string | undefined

  constructor(todoDir: string, todoFile?: string, doneFile?: string) {
    this.todoDir = todoDir
    this.todoFile = todoFile
    this.doneFile = doneFile
  }

  async run(command: string, args: string[]): Promise<string | Task[]> {
    let todoManager: TodoManager
    let effectiveCommand = command
    let effectiveArgs = args

    // Path handling logic
    let isPath = false
    try {
      await fs.stat(command)
      isPath = true
    } catch (error) {
      // Not a path
    }

    if (isPath) {
      let filePath = command
      const stats = await fs.stat(command)
      if (stats.isDirectory()) {
        filePath = path.join(command, 'todo.md')
      }
      todoManager = new TodoManager(
        path.dirname(filePath),
        path.basename(filePath)
      )
      effectiveCommand = args[0] || ValidCommands.List
      effectiveArgs = args.slice(1)
    } else {
      todoManager = new TodoManager(this.todoDir, this.todoFile, this.doneFile)
    }

    await todoManager.loadTasks()
    const tasks = todoManager.getTasks()

    if (
      !Object.values(ValidCommands).includes(effectiveCommand as ValidCommands)
    ) {
      return `Error: Unknown command "${effectiveCommand}".\nRun 'todomd --help' to see a list of available commands.`
    }

    switch (effectiveCommand) {
      case ValidCommands.Init:
        await todoManager.init()
        return 'TodoMD directory initialized'

      case ValidCommands.Add:
      case ValidCommands.AddAlias:
        const taskText = effectiveArgs.join(' ')
        if (!taskText) return 'Error: Please provide a task description'
        await todoManager.addTask(taskText)
        return 'Task added successfully'

      case ValidCommands.Done:
      case ValidCommands.DoneAlias: {
        const id = parseInt(effectiveArgs[0])
        if (isNaN(id) || !tasks[id - 1]) return 'Error: Invalid task ID'
        await todoManager.updateTask(id - 1, { status: Status.Done })
        return 'Task completed'
      }

      case ValidCommands.Undone:
      case ValidCommands.UndoneAlias: {
        const id = parseInt(effectiveArgs[0])
        if (isNaN(id) || !tasks[id - 1]) return 'Error: Invalid task ID'
        await todoManager.updateTask(id - 1, { status: Status.Todo })
        return 'Task marked as incomplete'
      }

      case ValidCommands.InProgress:
      case ValidCommands.InProgressAlias: {
        const id = parseInt(effectiveArgs[0])
        if (isNaN(id) || !tasks[id - 1]) return 'Error: Invalid task ID'
        await todoManager.updateTask(id - 1, { status: Status.InProgress })
        return 'Task marked as in-progress'
      }

      case ValidCommands.Cancel:
      case ValidCommands.CancelAlias: {
        const id = parseInt(effectiveArgs[0])
        if (isNaN(id) || !tasks[id - 1]) return 'Error: Invalid task ID'
        await todoManager.updateTask(id - 1, { status: Status.Cancelled })
        return 'Task cancelled'
      }

      case ValidCommands.Delete:
      case ValidCommands.DeleteAliasRm:
      case ValidCommands.DeleteAliasDel:
        const idToDelete = parseInt(effectiveArgs[0])
        if (isNaN(idToDelete) || !tasks[idToDelete - 1]) {
          return 'Error: Invalid task ID'
        }
        await todoManager.deleteTask(idToDelete - 1)
        return 'Task deleted'

      case ValidCommands.Archive:
        await todoManager.archive()
        return 'Completed tasks archived'

      case ValidCommands.Priority:
      case ValidCommands.PriorityAlias: {
        const id = parseInt(effectiveArgs[0])
        const priority = effectiveArgs[1]
        if (isNaN(id) || !tasks[id - 1]) return 'Error: Invalid task ID'
        if (!priority || !/^[A-Z]$/.test(priority))
          return 'Error: Priority must be a single uppercase letter'
        await todoManager.updateTask(id - 1, { priority })
        return `Priority for task ${id} set to (${priority})`
      }

      case ValidCommands.Project:
      case ValidCommands.ProjectAlias: {
        const id = parseInt(effectiveArgs[0])
        const project = effectiveArgs[1]
        if (isNaN(id) || !tasks[id - 1]) return 'Error: Invalid task ID'
        if (!project) return 'Error: Please provide a project name'
        const newProjects = [...(tasks[id - 1].projects || []), project]
        await todoManager.updateTask(id - 1, { projects: newProjects })
        return `Project +${project} added to task ${id}`
      }

      case ValidCommands.Context:
      case ValidCommands.ContextAlias: {
        const id = parseInt(effectiveArgs[0])
        const context = effectiveArgs[1]
        if (isNaN(id) || !tasks[id - 1]) return 'Error: Invalid task ID'
        if (!context) return 'Error: Please provide a context name'
        const newContexts = [...(tasks[id - 1].contexts || []), context]
        await todoManager.updateTask(id - 1, { contexts: newContexts })
        return `Context @${context} added to task ${id}`
      }

      case ValidCommands.Due: {
        const id = parseInt(effectiveArgs[0])
        const date = effectiveArgs[1]
        if (isNaN(id) || !tasks[id - 1]) return 'Error: Invalid task ID'
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return 'Error: Date must be in YYYY-MM-DD format'
        }
        await todoManager.updateTask(id - 1, { dueDate: date })
        return `Due date for task ${id} set to ${date}`
      }

      case ValidCommands.Search: {
        const searchTerm = effectiveArgs.join(' ')
        if (!searchTerm) return 'Error: Please provide a search term'
        const results = tasks.filter((t) =>
          t.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        if (results.length === 0)
          return `No tasks found matching "${searchTerm}"`
        return results
      }

      case ValidCommands.Edit:
      case ValidCommands.EditAlias: {
        const editor =
          process.env.EDITOR || (os.platform() === 'win32' ? 'notepad' : 'vim')
        const todoFilePath = todoManager.getTodoFilePath()
        const child = spawn(editor, [todoFilePath], { stdio: 'inherit' })
        return new Promise((resolve) => {
          child.on('exit', () => resolve('Editor closed.'))
        })
      }

      case ValidCommands.ListCon:
      case ValidCommands.ListConAlias: {
        const contextFilter = effectiveArgs[0]
        if (!contextFilter) {
          const allContexts = [
            ...new Set(tasks.flatMap((t) => t.contexts || []))
          ]
          return allContexts.length > 0
            ? allContexts.map((c) => `@${c}`).join('\n')
            : 'No contexts found.'
        }
        const results = tasks.filter((t) => t.contexts?.includes(contextFilter))
        if (results.length === 0)
          return `No tasks found for context "@${contextFilter}"`
        return results
      }

      case ValidCommands.ListProj:
      case ValidCommands.ListProjAlias: {
        const projectFilter = effectiveArgs[0]
        if (!projectFilter) {
          const allProjects = [
            ...new Set(tasks.flatMap((t) => t.projects || []))
          ]
          return allProjects.length > 0
            ? allProjects.map((p) => `+${p}`).join('\n')
            : 'No projects found.'
        }
        const results = tasks.filter((t) => t.projects?.includes(projectFilter))
        if (results.length === 0)
          return `No tasks found for project "+${projectFilter}"`
        return results
      }

      case ValidCommands.List:
      case ValidCommands.ListAlias:
      default:
        return tasks
    }
  }
}
