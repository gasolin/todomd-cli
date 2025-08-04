import fs from 'fs/promises'
import path from 'path'
import { Task, Status } from '../types/Task'
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

  getTodoFilePath(): string {
    return this.todoFile
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
    try {
      await fs.access(this.todoFile)
    } catch {
      await fs.writeFile(this.todoFile, '', 'utf8')
    }

    try {
      await fs.access(this.doneFile)
    } catch {
      await fs.writeFile(this.doneFile, '', 'utf8')
    }
  }

  async loadTasks(): Promise<Task[]> {
    try {
      const content = await fs.readFile(this.todoFile, 'utf8')
      this.tasks = this.parser.parse(content)
      return this.tasks
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.tasks = []
        return []
      }
      // Re-throw other errors
      throw error
    }
  }

  getTasks(): Task[] {
    return this.tasks
  }

  async saveTasks(): Promise<void> {
    const content = this.parser.serialize(this.tasks)
    await fs.writeFile(this.todoFile, content, 'utf8')
  }

  async addTask(taskText: string): Promise<void> {
    const newTask = this.parser.parseTaskLine(
      `- [ ] ${taskText}`,
      0,
      this.tasks.length
    )
    if (!newTask.creationDate) {
      newTask.creationDate = new Date().toISOString().split('T')[0]
    }
    this.tasks.push(newTask)
    await this.saveTasks()
  }

  async updateTask(
    index: number,
    updatedProperties: Partial<Task>
  ): Promise<void> {
    if (index < 0 || index >= this.tasks.length) {
      throw new Error('Invalid task index')
    }

    const originalTask = this.tasks[index]
    const updatedTask = { ...originalTask, ...updatedProperties }

    // Set completion date if status is changing to Done
    if (
      updatedTask.status === Status.Done &&
      originalTask.status !== Status.Done
    ) {
      updatedTask.completionDate = new Date().toISOString().split('T')[0]
    }

    // Remove completion date if status is changing away from Done
    if (
      updatedTask.status !== Status.Done &&
      originalTask.status === Status.Done
    ) {
      updatedTask.completionDate = undefined
    }

    this.tasks[index] = updatedTask
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
    const completedTasks = this.tasks.filter(
      (task) => task.status === Status.Done
    )
    const incompleteTasks = this.tasks.filter(
      (task) => task.status !== Status.Done
    )

    if (completedTasks.length === 0) {
      return
    }

    this.tasks = incompleteTasks
    await this.saveTasks()

    let doneContent = ''
    try {
      doneContent = await fs.readFile(this.doneFile, 'utf8')
    } catch {
      // ignore if done.md doesn't exist
    }
    const completedContent = this.parser.serialize(completedTasks)
    const updatedDoneContent =
      (doneContent ? doneContent + '\n' : '') + completedContent
    await fs.writeFile(this.doneFile, updatedDoneContent, 'utf8')
  }
}
