import { TodoManager } from './TodoManager.js';
import { Task } from '../types/Task.js';
import fs from 'fs/promises';
import path from 'path';

export class Commander {
  private todoDir: string;
  private todoFile: string | undefined;
  private doneFile: string | undefined;

  constructor(todoDir: string, todoFile?: string, doneFile?: string) {
    this.todoDir = todoDir;
    this.todoFile = todoFile;
    this.doneFile = doneFile;
  }

  async run(command: string, args: string[]): Promise<string | Task[]> {
    let todoManager: TodoManager;
    let effectiveCommand = command;
    let effectiveArgs = args;

    // Path handling logic
    try {
      const stats = await fs.stat(command);
      let filePath = command;
      if (stats.isDirectory()) {
        filePath = path.join(command, 'todo.md');
      }
      todoManager = new TodoManager(path.dirname(filePath), path.basename(filePath));
      effectiveCommand = args[0] || 'list'; // Use the next arg as command, or default to list
      effectiveArgs = args.slice(1);
    } catch (error) {
      // Not a path, use the default todoManager
      todoManager = new TodoManager(this.todoDir, this.todoFile, this.doneFile);
    }

    await todoManager.loadTasks();
    const tasks = todoManager.getTasks();

    switch (effectiveCommand) {
      case 'init':
        await todoManager.init();
        return 'TodoMD directory initialized';

      case 'add':
      case 'a':
        const taskText = effectiveArgs.join(' ');
        if (!taskText) return 'Error: Please provide a task description';
        await todoManager.addTask(taskText);
        return 'Task added successfully';

      case 'done':
      case 'do':
        const doneId = parseInt(effectiveArgs[0]);
        if (isNaN(doneId) || !tasks[doneId - 1]) {
          return 'Error: Invalid task ID';
        }
        const taskToComplete = tasks[doneId - 1];
        taskToComplete.completed = true;
        await todoManager.updateTask(doneId - 1, taskToComplete);
        return 'Task completed';

      case 'undone':
      case 'ud':
        const undoneId = parseInt(effectiveArgs[0]);
        if (isNaN(undoneId) || !tasks[undoneId - 1]) {
          return 'Error: Invalid task ID';
        }
        const taskToUncomplete = tasks[undoneId - 1];
        taskToUncomplete.completed = false;
        await todoManager.updateTask(undoneId - 1, taskToUncomplete);
        return 'Task marked as incomplete';

      case 'delete':
      case 'rm':
      case 'del':
        const idToDelete = parseInt(effectiveArgs[0]);
        if (isNaN(idToDelete) || !tasks[idToDelete - 1]) {
          return 'Error: Invalid task ID';
        }
        await todoManager.deleteTask(idToDelete - 1);
        return 'Task deleted';

      case 'archive':
        await todoManager.archive();
        return 'Completed tasks archived';

      case 'priority':
      case 'pri':
        const priId = parseInt(effectiveArgs[0]);
        const priority = effectiveArgs[1];
        if (isNaN(priId) || !tasks[priId - 1]) return 'Error: Invalid task ID';
        if (!priority || !/^[A-Z]$/.test(priority)) return 'Error: Priority must be a single uppercase letter';
        const taskToSetPriority = tasks[priId - 1];
        taskToSetPriority.priority = priority;
        await todoManager.updateTask(priId - 1, taskToSetPriority);
        return `Priority for task ${priId} set to (${priority})`;

      case 'project':
      case 'proj':
        const projId = parseInt(effectiveArgs[0]);
        const project = effectiveArgs[1];
        if (isNaN(projId) || !tasks[projId - 1]) return 'Error: Invalid task ID';
        if (!project) return 'Error: Please provide a project name';
        const taskToSetProject = tasks[projId - 1];
        if (!taskToSetProject.projects) taskToSetProject.projects = [];
        taskToSetProject.projects.push(project);
        await todoManager.updateTask(projId - 1, taskToSetProject);
        return `Project +${project} added to task ${projId}`;

      case 'context':
      case 'ctx':
        const ctxId = parseInt(effectiveArgs[0]);
        const context = effectiveArgs[1];
        if (isNaN(ctxId) || !tasks[ctxId - 1]) return 'Error: Invalid task ID';
        if (!context) return 'Error: Please provide a context name';
        const taskToSetContext = tasks[ctxId - 1];
        if (!taskToSetContext.contexts) taskToSetContext.contexts = [];
        taskToSetContext.contexts.push(context);
        await todoManager.updateTask(ctxId - 1, taskToSetContext);
        return `Context @${context} added to task ${ctxId}`;

      case 'due':
        const dueId = parseInt(effectiveArgs[0]);
        const dueDate = effectiveArgs[1];
        if (isNaN(dueId) || !tasks[dueId - 1]) return 'Error: Invalid task ID';
        if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return 'Error: Date must be in YYYY-MM-DD format';
        const taskToSetDue = tasks[dueId - 1];
        taskToSetDue.dueDate = dueDate;
        await todoManager.updateTask(dueId - 1, taskToSetDue);
        return `Due date for task ${dueId} set to ${dueDate}`;

      case 'search':
        const searchTerm = effectiveArgs.join(' ');
        if (!searchTerm) return 'Error: Please provide a search term';
        const filteredTasks = tasks.filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()));
        if (filteredTasks.length === 0) return `No tasks found matching "${searchTerm}"`;
        return filteredTasks;

      case 'list':
      case 'ls':
      default:
        return tasks;
    }
  }
}
