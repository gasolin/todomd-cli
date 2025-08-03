import fs from 'fs/promises';
import path from 'path';
import { Task } from '../types/Task.js';
import { TodoParser } from './TodoParser.js';

export class TodoManager {
  private todoDir: string;
  private todoFile: string;
  private doneFile: string;
  private parser: TodoParser;

  constructor(todoDir: string, todoFile: string = 'todo.md', doneFile: string = 'done.md') {
    this.todoDir = todoDir;
    this.todoFile = path.join(todoDir, todoFile);
    this.doneFile = path.join(todoDir, doneFile);
    this.parser = new TodoParser();
  }

  async ensureDir(): Promise<void> {
    try {
      await fs.access(this.todoDir);
    } catch {
      await fs.mkdir(this.todoDir, { recursive: true });
    }
  }

  async ensureFiles(): Promise<void> {
    await this.ensureDir();
    
    // Create todo.md if it doesn't exist
    try {
      await fs.access(this.todoFile);
    } catch {
      const initialContent = `# To-Do List

## Today's Tasks

<!-- Add your tasks here -->

---

## Completed Tasks

<!-- Completed tasks will appear here -->
`;
      await fs.writeFile(this.todoFile, initialContent, 'utf8');
    }

    // Create done.md if it doesn't exist
    try {
      await fs.access(this.doneFile);
    } catch {
      const initialContent = `# Completed Tasks

<!-- Completed tasks from todo.md will be moved here -->
`;
      await fs.writeFile(this.doneFile, initialContent, 'utf8');
    }
  }

  async loadTasks(): Promise<Task[]> {
    await this.ensureFiles();
    
    try {
      const content = await fs.readFile(this.todoFile, 'utf8');
      return this.parser.parse(content);
    } catch (error) {
      throw new Error(`Failed to load tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    await this.ensureFiles();
    
    try {
      const content = this.parser.serialize(tasks);
      await fs.writeFile(this.todoFile, content, 'utf8');
    } catch (error) {
      throw new Error(`Failed to save tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addTask(taskText: string): Promise<void> {
    const tasks = await this.loadTasks();
    const newTask = this.parser.parseTaskLine(taskText, 0, tasks.length);
    
    // Set creation date if not provided
    if (!newTask.creationDate) {
      newTask.creationDate = new Date().toISOString().split('T')[0];
    }
    
    tasks.push(newTask);
    await this.saveTasks(tasks);
  }

  async updateTask(index: number, updatedTask: Task): Promise<void> {
    const tasks = await this.loadTasks();
    
    if (index < 0 || index >= tasks.length) {
      throw new Error('Invalid task index');
    }

    // Set completion date if task is being marked as completed
    if (updatedTask.completed && !tasks[index].completed) {
      updatedTask.completionDate = new Date().toISOString().split('T')[0];
    }
    
    // Remove completion date if task is being marked as incomplete
    if (!updatedTask.completed && tasks[index].completed) {
      updatedTask.completionDate = undefined;
    }

    tasks[index] = { ...tasks[index], ...updatedTask };
    await this.saveTasks(tasks);
  }

  async deleteTask(index: number): Promise<void> {
    const tasks = await this.loadTasks();
    
    if (index < 0 || index >= tasks.length) {
      throw new Error('Invalid task index');
    }

    tasks.splice(index, 1);
    await this.saveTasks(tasks);
  }

  async moveCompletedTasks(): Promise<void> {
    const tasks = await this.loadTasks();
    const completedTasks = tasks.filter(task => task.completed);
    const incompleteTasks = tasks.filter(task => !task.completed);

    if (completedTasks.length === 0) {
      return;
    }

    // Save incomplete tasks to todo.md
    await this.saveTasks(incompleteTasks);

    // Append completed tasks to done.md
    try {
      let doneContent = '';
      try {
        doneContent = await fs.readFile(this.doneFile, 'utf8');
      } catch {
        doneContent = '# Completed Tasks\n\n';
      }

      const completedContent = this.parser.serialize(completedTasks);
      const updatedDoneContent = doneContent + '\n' + completedContent;
      
      await fs.writeFile(this.doneFile, updatedDoneContent, 'utf8');
    } catch (error) {
      throw new Error(`Failed to move completed tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async archiveCompleted(): Promise<void> {
    await this.moveCompletedTasks();
  }
}
