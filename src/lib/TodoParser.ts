import { Task, Status } from '../types/Task'

export class TodoParser {
  private rawLines: string[] = []

  parse(content: string): Task[] {
    this.rawLines = content.split('\n')
    const tasks: Task[] = []
    let currentId = 0
    let taskLineNumbers: number[] = []

    for (let i = 0; i < this.rawLines.length; i++) {
      const line = this.rawLines[i]

      if (this.isTaskLine(line)) {
        const task = this.parseTaskLine(
          line,
          this.getIndentLevel(line),
          currentId++
        )
        task.lineNumber = i
        tasks.push(task)
        taskLineNumbers.push(i)
      }
    }

    return tasks
  }


  private isTaskLine(line: string): boolean {
    const trimmed = line.trim()
    return /^-\s*\[([ x~-])\]/.test(trimmed)
  }

  private getIndentLevel(line: string): number {
    const match = line.match(/^(\s*)/)
    const whitespace = match ? match[1] : ''
    // Count spaces and tabs (tabs count as 4 spaces)
    return whitespace.replace(/\t/g, '    ').length / 2
  }

  parseTaskLine(line: string, level: number = 0, id: number = 0): Task {
    const trimmed = line.trim()

    // Extract task status
    const statusMatch = trimmed.match(/^-\s*\[([x~ -])\]\s*(.*)/)
    if (!statusMatch) {
      throw new Error(`Invalid task line: ${line}`)
    }

    const statusChar = statusMatch[1]
    const taskContent = statusMatch[2]

    let status: Status = Status.Todo
    if (statusChar === 'x') {
      status = Status.Done
    } else if (statusChar === '-') {
      status = Status.Cancelled
    } else if (statusChar === '~') {
      status = Status.InProgress
    }

    const task: Task = {
      id,
      description: '',
      status: status,
      level,
      projects: [],
      contexts: [],
      tags: [],
      customAttributes: {}
    }

    // Parse priority (A) to (Z) at the beginning
    let remainingContent = taskContent
    const priorityMatch = remainingContent.match(/^\(([A-Z])\)\s*(.*)/)
    if (priorityMatch) {
      task.priority = priorityMatch[1]
      remainingContent = priorityMatch[2]
    }

    // Parse projects (+project)
    const projectMatches = remainingContent.match(/\+([^\s]+)/g)
    if (projectMatches) {
      task.projects = projectMatches.map((match) => match.substring(1))
    }

    // Parse contexts (@context)
    const contextMatches = remainingContent.match(/@([^\s]+)/g)
    if (contextMatches) {
      task.contexts = contextMatches.map((match) => match.substring(1))
    }

    // Parse tags (#tag)
    const tagMatches = remainingContent.match(/#([^\s]+)/g)
    if (tagMatches) {
      task.tags = tagMatches.map((match) => match.substring(1))
    }

    // Parse key:value attributes
    const kvMatches = remainingContent.match(/(\w+):([^\s]+)/g)
    if (kvMatches) {
      kvMatches.forEach((match) => {
        const [key, value] = match.split(':')
        switch (key) {
          case 'cr':
            task.creationDate = value
            break
          case 'cm':
            task.completionDate = value
            break
          case 'due':
            task.dueDate = value
            break
          case 'rec':
            task.recurrence = value
            break
          case 'status':
            if (Object.values(Status).includes(value as Status)) {
              task.status = value as Status
            }
            break
          default:
            if (!task.customAttributes) {
              task.customAttributes = {}
            }
            task.customAttributes[key] = value
            break
        }
      })
    }

    // Extract the main description (remove metadata)
    let description = remainingContent
    description = description.replace(/\([A-Z]\)/g, '').trim() // Remove priority
    description = description.replace(/\+[^\s]+/g, '').trim() // Remove projects
    description = description.replace(/@[^\s]+/g, '').trim() // Remove contexts
    description = description.replace(/#[^\s]+/g, '').trim() // Remove tags
    description = description.replace(/\w+:[^\s]+/g, '').trim() // Remove key:value pairs
    description = description.replace(/\s+/g, ' ').trim() // Normalize whitespace

    task.description = description

    return task
  }

  serialize(tasks: Task[], forArchive: boolean = false): string {
    if (forArchive) {
      return tasks.map(task => this.serializeTask(task)).join('\n');
    }

    const updatedLines = [...this.rawLines];
    let taskIndex = 0;
    for (let i = 0; i < updatedLines.length; i++) {
      if (this.isTaskLine(updatedLines[i])) {
        const task = tasks[taskIndex];
        if (task && task.lineNumber === i) {
          updatedLines[i] = this.serializeTask(task);
          taskIndex++;
        }
      }
    }

    return updatedLines.join('\n');
  }

  private serializeTask(task: Task): string {
    const indent = '  '.repeat(task.level)
    let statusChar = ' '
    if (task.status === Status.Done) {
      statusChar = 'x'
    } else if (task.status === Status.Cancelled) {
      statusChar = '-'
    } else if (task.status === Status.InProgress) {
      statusChar = '~'
    }

    let taskLine = `${indent}- [${statusChar}] `

    if (task.priority) {
      taskLine += `(${task.priority}) `
    }

    let descriptionPart = task.description
    const metadata: string[] = []

    if (task.projects && task.projects.length > 0) {
      metadata.push(...task.projects.map((p) => `+${p}`))
    }
    if (task.contexts && task.contexts.length > 0) {
      metadata.push(...task.contexts.map((c) => `@${c}`))
    }
    if (task.tags && task.tags.length > 0) {
      metadata.push(...task.tags.map((t) => `#${t}`))
    }
    if (task.creationDate) {
      metadata.push(`cr:${task.creationDate}`)
    }
    if (task.completionDate) {
      metadata.push(`cm:${task.completionDate}`)
    }
    if (task.dueDate) {
      metadata.push(`due:${task.dueDate}`)
    }
    if (task.recurrence) {
      metadata.push(`rec:${task.recurrence}`)
    }
    if (task.customAttributes) {
      Object.entries(task.customAttributes).forEach(([key, value]) => {
        metadata.push(`${key}:${value}`)
      })
    }

    taskLine += descriptionPart
    if (metadata.length > 0) {
      taskLine += ' ' + metadata.join(' ')
    }
    return taskLine;
  }
}
