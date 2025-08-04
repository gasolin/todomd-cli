import { TodoManager } from './TodoManager.js';
import { Task } from '../types/Task.js';
import { ValidCommands } from '../types/Commands.js';
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
    let isPath = false;
    try {
      await fs.stat(command);
      isPath = true;
    } catch (error) {
      // Not a path
    }

    if (isPath) {
      let filePath = command;
      const stats = await fs.stat(command);
      if (stats.isDirectory()) {
        filePath = path.join(command, 'todo.md');
      }
      todoManager = new TodoManager(path.dirname(filePath), path.basename(filePath));
      effectiveCommand = args[0] || ValidCommands.List;
      effectiveArgs = args.slice(1);
    } else {
      todoManager = new TodoManager(this.todoDir, this.todoFile, this.doneFile);
    }

    await todoManager.loadTasks();
    const tasks = todoManager.getTasks();

    if (!Object.values(ValidCommands).includes(effectiveCommand as ValidCommands)) {
      return `Error: Unknown command "${effectiveCommand}".\nRun 'todomd --help' to see a list of available commands.`;
    }

    switch (effectiveCommand) {
      case ValidCommands.Init:
        await todoManager.init();
        return 'TodoMD directory initialized';

      case ValidCommands.Add:
      case ValidCommands.AddAlias:
        const taskText = effectiveArgs.join(' ');
        if (!taskText) return 'Error: Please provide a task description';
        await todoManager.addTask(taskText);
        return 'Task added successfully';

      case ValidCommands.Done:
      case ValidCommands.DoneAlias:
        const doneId = parseInt(effectiveArgs[0]);
        if (isNaN(doneId) || !tasks[doneId - 1]) {
          return 'Error: Invalid task ID';
        }
        const taskToComplete = tasks[doneId - 1];
        taskToComplete.completed = true;
        await todoManager.updateTask(doneId - 1, taskToComplete);
        return 'Task completed';

      case ValidCommands.Undone:
      case ValidCommands.UndoneAlias:
        const undoneId = parseInt(effectiveArgs[0]);
        if (isNaN(undoneId) || !tasks[undoneId - 1]) {
          return 'Error: Invalid task ID';
        }
        const taskToUncomplete = tasks[undoneId - 1];
        taskToUncomplete.completed = false;
        await todoManager.updateTask(undoneId - 1, taskToUncomplete);
        return 'Task marked as incomplete';

      case ValidCommands.Delete:
      case ValidCommands.DeleteAliasRm:
      case ValidCommands.DeleteAliasDel:
        const idToDelete = parseInt(effectiveArgs[0]);
        if (isNaN(idToDelete) || !tasks[idToDelete - 1]) {
          return 'Error: Invalid task ID';
        }
        await todoManager.deleteTask(idToDelete - 1);
        return 'Task deleted';

      case ValidCommands.Archive:
        await todoManager.archive();
        return 'Completed tasks archived';

      case ValidCommands.Priority:
      case ValidCommands.PriorityAlias:
        const priId = parseInt(effectiveArgs[0]);
        const priority = effectiveArgs[1];
        if (isNaN(priId) || !tasks[priId - 1]) return 'Error: Invalid task ID';
        if (!priority || !/^[A-Z]$/.test(priority)) return 'Error: Priority must be a single uppercase letter';
        const taskToSetPriority = tasks[priId - 1];
        taskToSetPriority.priority = priority;
        await todoManager.updateTask(priId - 1, taskToSetPriority);
        return `Priority for task ${priId} set to (${priority})`;

      case ValidCommands.Project:
      case ValidCommands.ProjectAlias:
        const projId = parseInt(effectiveArgs[0]);
        const project = effectiveArgs[1];
        if (isNaN(projId) || !tasks[projId - 1]) return 'Error: Invalid task ID';
        if (!project) return 'Error: Please provide a project name';
        const taskToSetProject = tasks[projId - 1];
        if (!taskToSetProject.projects) taskToSetProject.projects = [];
        taskToSetProject.projects.push(project);
        await todoManager.updateTask(projId - 1, taskToSetProject);
        return `Project +${project} added to task ${projId}`;

      case ValidCommands.Context:
      case ValidCommands.ContextAlias:
        const ctxId = parseInt(effectiveArgs[0]);
        const context = effectiveArgs[1];
        if (isNaN(ctxId) || !tasks[ctxId - 1]) return 'Error: Invalid task ID';
        if (!context) return 'Error: Please provide a context name';
        const taskToSetContext = tasks[ctxId - 1];
        if (!taskToSetContext.contexts) taskToSetContext.contexts = [];
        taskToSetContext.contexts.push(context);
        await todoManager.updateTask(ctxId - 1, taskToSetContext);
        return `Context @${context} added to task ${ctxId}`;

      case ValidCommands.Due: {
        const id = parseInt(effectiveArgs[0]);
        const date = effectiveArgs[1];

        if (isNaN(id) || !tasks[id - 1]) {
          return 'Error: Invalid task ID';
        }
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return 'Error: Date must be in YYYY-MM-DD format';
        }

        const taskToUpdate = tasks[id - 1];
        taskToUpdate.dueDate = date;
        await todoManager.updateTask(id - 1, taskToUpdate);
        return `Due date for task ${id} set to ${date}`;
      }

      case ValidCommands.Search:
        const searchTerm = effectiveArgs.join(' ');
        if (!searchTerm) return 'Error: Please provide a search term';
        const filteredTasks = tasks.filter(t => t.description.toLowerCase().includes(searchTerm.toLowerCase()));
        if (filteredTasks.length === 0) return `No tasks found matching "${searchTerm}"`;
        return filteredTasks;
        
      case ValidCommands.ListCon:
      case ValidCommands.ListConAlias: {
        const contextFilter = effectiveArgs[0];
        if (!contextFilter) {
          // No context provided, list all unique contexts
          const allContexts = tasks.reduce((acc, task) => {
            if (task.contexts) {
              task.contexts.forEach(context => acc.add(context));
            }
            return acc;
          }, new Set<string>());

          if (allContexts.size === 0) {
            return 'No contexts found.';
          }
          return Array.from(allContexts).map(c => `@${c}`).join('\n');
        }

        const filteredByContext = tasks.filter(t => t.contexts?.includes(contextFilter));
        if (filteredByContext.length === 0) return `No tasks found for context "@${contextFilter}"`;
        return filteredByContext;
      }

      case ValidCommands.ListPri:
      case ValidCommands.ListPriAlias:
        const priorityFilter = effectiveArgs[0];
        if (!priorityFilter) return 'Error: Please provide a priority';
        const filteredByPriority = tasks.filter(t => t.priority === priorityFilter);
        if (filteredByPriority.length === 0) return `No tasks found for priority "(${priorityFilter})"`;
        return filteredByPriority;

      case ValidCommands.ListProj:
      case ValidCommands.ListProjAlias: {
        const projectFilter = effectiveArgs[0];
        if (!projectFilter) {
          // No project provided, list all unique projects
          const allProjects = tasks.reduce((acc, task) => {
            if (task.projects) {
              task.projects.forEach(project => acc.add(project));
            }
            return acc;
          }, new Set<string>());

          if (allProjects.size === 0) {
            return 'No projects found.';
          }
          return Array.from(allProjects).map(p => `+${p}`).join('\n');
        }

        const filteredByProject = tasks.filter(t => t.projects?.includes(projectFilter));
        if (filteredByProject.length === 0) return `No tasks found for project "+${projectFilter}"`;
        return filteredByProject;
      }

      case ValidCommands.ListAll:
      case ValidCommands.ListAllAlias:
        return tasks;

      case ValidCommands.List:
      case ValidCommands.ListAlias:
      default:
        return tasks.filter(task => !task.completed && !task.cancelled);
    }
  }
}