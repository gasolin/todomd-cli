import { TodoManager } from './TodoManager'
import { Task, Status } from '../types/Task'
import { ValidCommands } from '../types/Commands'
import { getListTasks } from './TaskLister'
import fs from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'
import { format } from 'date-fns'

import { getDueDate } from './DueDate'
import { runScript } from './runScript'

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

    if (
      !Object.values(ValidCommands).includes(effectiveCommand as ValidCommands)
    ) {
      return `Error: Unknown command "${effectiveCommand}".\nRun 'todomd --help' to see a list of available commands.`
    }

    await todoManager.loadTasks()
    const tasks = todoManager.getTasks()

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

        const task = tasks[id - 1]
        await todoManager.updateTask(id - 1, { status: Status.Done })

        const doneCommand = process.env.TODOMD_WHEN_DONE
        // runScript
        if (doneCommand) {
          const taskDesc = task.projects
            ? `${task.projects?.map((item) => '#' + item).join(' ')} ${task.description} ${task.contexts?.map((item) => '@' + item).join(' ')}`
            : task.description
          console.log('Executing script:', doneCommand, taskDesc)

          const error = await runScript(doneCommand, taskDesc)
          if (error) {
            return error
          }
        }

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
        const dateArg = effectiveArgs.slice(1).join(' ').toLowerCase()

        if (isNaN(id) || !tasks[id - 1]) return 'Error: Invalid task ID'
        if (!dateArg) return 'Error: Please provide a date'

        const dueDate = getDueDate(dateArg)

        if (!dueDate) {
          return 'Error: Date must be in YYYY-MM-DD format or a supported keyword (today, tomorrow, next friday, in 2 weeks, etc.)'
        }

        const formattedDate = format(dueDate, 'yyyy-MM-dd')
        await todoManager.updateTask(id - 1, { dueDate: formattedDate })
        return `Due date for task ${id} set to ${formattedDate}`
      }

      case ValidCommands.List:
      case ValidCommands.ListAlias:
        if (effectiveArgs.length > 0) {
          return getListTasks('search', effectiveArgs, tasks)
        }
        return getListTasks(effectiveCommand, effectiveArgs, tasks)

      case ValidCommands.ListCon:
      case ValidCommands.ListConAlias:
      case ValidCommands.ListProj:
      case ValidCommands.ListProjAlias:
        return getListTasks(effectiveCommand, effectiveArgs, tasks)

      case ValidCommands.Edit:
      case ValidCommands.EditAlias:
      case ValidCommands.EditAliasReplace: {
        const id = parseInt(effectiveArgs[0])
        const newDescription = effectiveArgs.slice(1).join(' ')
        if (isNaN(id) || !tasks[id - 1]) {
          return 'Error: Invalid task ID'
        }
        if (!newDescription) {
          return 'Error: Please provide a new description for the task'
        }
        await todoManager.updateTask(id - 1, { description: newDescription })
        return 'Task updated successfully'
      }

      default:
        return getListTasks(effectiveCommand, effectiveArgs, tasks)
    }
  }
}
