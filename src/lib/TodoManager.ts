import fs from 'fs/promises'
import path from 'path'
import { Task } from '../types/Task'
import { TodoParser } from './TodoParser'

export class TodoManager {
  private todoDir: string
  private todoFile: string
  private doneFile: string
  private parser: TodoParser
  private tasks: Task[] = []

  constructor(
    todoDir: string,
    todoFile: string = 'todo.md',
    doneFile: string = 'done.md'
  ) {
    this.todoDir = todoDir
    this.todoFile = path.join(todoDir, todoFile)
    this.doneFile = path.join(todoDir, doneFile)
    this.parser = new TodoParser()
  }

  async init(): Promise<void> {
    await this.ensureDir()
    await this.ensureFiles()
  }

  private async ensureDir(): Promise<void> {
    try {
      await fs.access(this.todoDir)
    } catch {
      await fs.mkdir(this.todoDir, { recursive: true })
    }
  }

  private async ensureFiles(): Promise<void> {
    // Create todo.md if it doesn't exist
    try {
      await fs.access(this.todoFile)
    } catch {
      const initialContent = `# To-Do List

## Today's Tasks

<!-- Add your tasks here -->

---

## Completed Tasks

<!-- Completed tasks will appear here -->
`
      await fs.writeFile(this.todoFile, initialContent, 'utf8')
    }

    // Create done.md if it doesn't exist
    try {
      await fs.access(this.doneFile)
    } catch {
      const initialContent = `# Completed Tasks

<!-- Completed tasks from todo.md will be moved here -->
`
      await fs.writeFile(this.doneFile, initialContent, 'utf8')
    }
  }

  async loadTasks(): Promise<Task[]> {
    try {
      const content = await fs.readFile(this.todoFile, 'utf8')
      this.tasks = this.parser.parse(content)
      return this.tasks
    } catch (error) {
      // If file doesn't exist, return empty array
      if (
        error instanceof Error &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        this.tasks = []
        return []
      }
      throw new Error(
        `Failed to load tasks: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  getTasks(): Task[] {
    return this.tasks
  }

  async saveTasks(): Promise<void> {
    try {
      const content = this.parser.serialize(this.tasks)
      await fs.writeFile(this.todoFile, content, 'utf8')
    } catch (error) {
      throw new Error(
        `Failed to save tasks: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async addTask(taskText: string): Promise<void> {
    const formattedTaskText = `- [ ] ${taskText}`
    const newTask = this.parser.parseTaskLine(
      formattedTaskText,
      0,
      this.tasks.length
    )

    // Set creation date if not provided
    if (!newTask.creationDate) {
      newTask.creationDate = new Date().toISOString().split('T')[0]
    }

    this.tasks.push(newTask)
    await this.saveTasks()
  }

  async updateTask(index: number, updatedTask: Task): Promise<void> {
    if (index < 0 || index >= this.tasks.length) {
      throw new Error('Invalid task index')
    }

    // Set completion date if task is being marked as completed
    if (updatedTask.completed && !this.tasks[index].completed) {
      updatedTask.completionDate = new Date().toISOString().split('T')[0]
    }

    // Remove completion date if task is being marked as incomplete
    if (!updatedTask.completed && this.tasks[index].completed) {
      updatedTask.completionDate = undefined
    }

    this.tasks[index] = { ...this.tasks[index], ...updatedTask }
    await this.saveTasks()
  }

  async deleteTask(index: number): Promise<void> {
    if (index < 0 || index >= this.tasks.length) {
      throw new Error('Invalid task index')
    }

    this.tasks.splice(index, 1)
    await this.saveTasks()
  }

  async archive(): Promise<void> {
    const completedTasks = this.tasks.filter((task) => task.completed)
    const incompleteTasks = this.tasks.filter((task) => !task.completed)

    if (completedTasks.length === 0) {
      return
    }

    this.tasks = incompleteTasks
    await this.saveTasks()

    // Append completed tasks to done.md
    try {
      let doneContent = ''
      try {
        doneContent = await fs.readFile(this.doneFile, 'utf8')
      } catch {
        doneContent = '# Completed Tasks\n\n'
      }

      const completedContent = this.parser.serialize(completedTasks)
      const updatedDoneContent =
        doneContent +
        '\n' +
        completedContent.replace(/# To-Do List\n\n## Tasks\n\n/, '')

      await fs.writeFile(this.doneFile, updatedDoneContent, 'utf8')
    } catch (error) {
      throw new Error(
        `Failed to move completed tasks: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}
