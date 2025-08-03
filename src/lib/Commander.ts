import { TodoManager } from './TodoManager.js';
import { Task } from '../types/Task.js';

export class Commander {
  private todoManager: TodoManager;

  constructor(todoDir: string, todoFile?: string, doneFile?: string) {
    this.todoManager = new TodoManager(todoDir, todoFile, doneFile);
  }

  async run(command: string, args: string[]): Promise<string | Task[]> {
    await this.todoManager.loadTasks();
    const tasks = this.todoManager.getTasks();

    switch (command) {
      case 'init':
        await this.todoManager.init();
        return 'TodoMD directory initialized';

      case 'add':
      case 'a':
        const taskText = args.join(' ');
        if (!taskText) return 'Error: Please provide a task description';
        await this.todoManager.addTask(taskText);
        return 'Task added successfully';

      case 'done':
      case 'do':
        const doneId = parseInt(args[0]);
        if (isNaN(doneId) || !tasks[doneId - 1]) {
          return 'Error: Invalid task ID';
        }
        const taskToComplete = tasks[doneId - 1];
        taskToComplete.completed = true;
        await this.todoManager.updateTask(doneId - 1, taskToComplete);
        return 'Task completed';

      case 'undone':
      case 'ud':
        const undoneId = parseInt(args[0]);
        if (isNaN(undoneId) || !tasks[undoneId - 1]) {
          return 'Error: Invalid task ID';
        }
        const taskToUncomplete = tasks[undoneId - 1];
        taskToUncomplete.completed = false;
        await this.todoManager.updateTask(undoneId - 1, taskToUncomplete);
        return 'Task marked as incomplete';

      case 'delete':
      case 'rm':
      case 'del':
        const idToDelete = parseInt(args[0]);
        if (isNaN(idToDelete) || !tasks[idToDelete - 1]) {
          return 'Error: Invalid task ID';
        }
        await this.todoManager.deleteTask(idToDelete - 1);
        return 'Task deleted';

      case 'priority':
      case 'pri':
        const priId = parseInt(args[0]);
        const priority = args[1];
        if (isNaN(priId) || !tasks[priId - 1]) return 'Error: Invalid task ID';
        if (!priority || !/^[A-Z]$/.test(priority)) return 'Error: Priority must be a single uppercase letter';
        const taskToSetPriority = tasks[priId - 1];
        taskToSetPriority.priority = priority;
        await this.todoManager.updateTask(priId - 1, taskToSetPriority);
        return `Priority for task ${priId} set to (${priority})`;

      case 'project':
      case 'proj':
        const projId = parseInt(args[0]);
        const project = args[1];
        if (isNaN(projId) || !tasks[projId - 1]) return 'Error: Invalid task ID';
        if (!project) return 'Error: Please provide a project name';
        const taskToSetProject = tasks[projId - 1];
        if (!taskToSetProject.projects) taskToSetProject.projects = [];
        taskToSetProject.projects.push(project);
        await this.todoManager.updateTask(projId - 1, taskToSetProject);
        return `Project +${project} added to task ${projId}`;

      case 'context':
      case 'ctx':
        const ctxId = parseInt(args[0]);
        const context = args[1];
        if (isNaN(ctxId) || !tasks[ctxId - 1]) return 'Error: Invalid task ID';
        if (!context) return 'Error: Please provide a context name';
        const taskToSetContext = tasks[ctxId - 1];
        if (!taskToSetContext.contexts) taskToSetContext.contexts = [];
        taskToSetContext.contexts.push(context);
        await this.todoManager.updateTask(ctxId - 1, taskToSetContext);
        return `Context @${context} added to task ${ctxId}`;

      case 'due':
        const dueId = parseInt(args[0]);
        const dueDate = args[1];
        if (isNaN(dueId) || !tasks[dueId - 1]) return 'Error: Invalid task ID';
        if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return 'Error: Date must be in YYYY-MM-DD format';
        const taskToSetDue = tasks[dueId - 1];
        taskToSetDue.dueDate = dueDate;
        await this.todoManager.updateTask(dueId - 1, taskToSetDue);
        return `Due date for task ${dueId} set to ${dueDate}`;

      case 'search':
        const searchTerm = args.join(' ');
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
