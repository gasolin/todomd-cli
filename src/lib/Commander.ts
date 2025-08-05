import { TodoManager } from './TodoManager'
import { Task, Status } from '../types/Task'
import { ValidCommands } from '../types/Commands'
import { getListTasks } from './TaskLister'
import fs from 'fs/promises'
import path from 'path'
import { spawn, exec } from 'child_process'
import os from 'os'
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  nextDay,
  parseISO,
  Day,
  setDay
} from 'date-fns'

const dayMap: Record<string, Day> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
}

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

        const task = tasks[id - 1]
        await todoManager.updateTask(id - 1, { status: Status.Done })

        const doneCommand = process.env.TODO_CMD_WHEN_DONE
        if (doneCommand) {
          const env = { ...process.env, TASK_DESCRIPTION: task.description }
          exec(
            doneCommand,
            { env },
            (err: Error | null, stdout: string, stderr: string) => {
              if (err) {
                // In a CLI, we might want to log this to stderr, but for now, we'll ignore it
              }
            }
          )
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

        let dueDate: Date | null = null
        const now = new Date()

        // YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateArg)) {
          try {
            dueDate = parseISO(dateArg)
          } catch (e) {
            /* ignore */
          }
        } else if (dateArg === 'today') {
          dueDate = now
        } else if (dateArg === 'tomorrow') {
          dueDate = addDays(now, 1)
        } else if (dateArg === 'yesterday') {
          dueDate = addDays(now, -1)
        } else {
          const relativeMatch = dateArg.match(
            /in (\d+) (day|week|month|year)s?/
          )
          if (relativeMatch) {
            const amount = parseInt(relativeMatch[1])
            const unit = relativeMatch[2]
            if (unit === 'day') dueDate = addDays(now, amount)
            if (unit === 'week') dueDate = addWeeks(now, amount)
            if (unit === 'month') dueDate = addMonths(now, amount)
            if (unit === 'year') dueDate = addYears(now, amount)
          } else {
            const dayMatch = dateArg.match(
              /^(this |next )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/
            )
            if (dayMatch) {
              const modifier = dayMatch[1]?.trim()
              const dayName = dayMatch[2]
              const day = dayMap[dayName]

              if (modifier === 'this') {
                dueDate = setDay(now, day)
              } else if (modifier === 'next') {
                dueDate = setDay(addWeeks(now, 1), day)
              } else {
                dueDate = nextDay(now, day)
              }
            }
          }
        }

        if (!dueDate) {
          return 'Error: Date must be in YYYY-MM-DD format or a supported keyword (today, tomorrow, next friday, in 2 weeks, etc.)'
        }

        const formattedDate = format(dueDate, 'yyyy-MM-dd')
        await todoManager.updateTask(id - 1, { dueDate: formattedDate })
        return `Due date for task ${id} set to ${formattedDate}`
      }

      case ValidCommands.Search:
      case ValidCommands.List:
      case ValidCommands.ListAlias:
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
