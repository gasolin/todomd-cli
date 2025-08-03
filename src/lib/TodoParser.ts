import { Task } from '../types/Task.js';

export class TodoParser {
  parse(content: string): Task[] {
    const lines = content.split('\n');
    const tasks: Task[] = [];
    let currentId = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (this.isTaskLine(line)) {
        const task = this.parseTaskLine(line, this.getIndentLevel(line), currentId++);
        tasks.push(task);
      }
    }

    return tasks;
  }

  private isTaskLine(line: string): boolean {
    const trimmed = line.trim();
    return /^-\s*\[([ x-])\]/.test(trimmed);
  }

  private getIndentLevel(line: string): number {
    const match = line.match(/^(\s*)/);
    const whitespace = match ? match[1] : '';
    // Count spaces and tabs (tabs count as 4 spaces)
    return whitespace.replace(/\t/g, '    ').length / 2;
  }

  parseTaskLine(line: string, level: number = 0, id: number = 0): Task {
    const trimmed = line.trim();
    
    // Extract task status
    const statusMatch = trimmed.match(/^-\s*\[([x -])\]\s*(.*)/);
    if (!statusMatch) {
      throw new Error(`Invalid task line: ${line}`);
    }

    const status = statusMatch[1];
    const taskContent = statusMatch[2];

    const task: Task = {
      id,
      description: '',
      completed: status === 'x',
      cancelled: status === '-',
      level,
      projects: [],
      contexts: [],
      tags: [],
      customAttributes: {}
    };

    // Parse priority (A) to (Z) at the beginning
    let remainingContent = taskContent;
    const priorityMatch = remainingContent.match(/^\(([A-Z])\)\s*(.*)/);
    if (priorityMatch) {
      task.priority = priorityMatch[1];
      remainingContent = priorityMatch[2];
    }

    // Parse projects (+project)
    const projectMatches = remainingContent.match(/\+([^\s]+)/g);
    if (projectMatches) {
      task.projects = projectMatches.map(match => match.substring(1));
    }

    // Parse contexts (@context)
    const contextMatches = remainingContent.match(/@([^\s]+)/g);
    if (contextMatches) {
      task.contexts = contextMatches.map(match => match.substring(1));
    }

    // Parse tags (#tag)
    const tagMatches = remainingContent.match(/#([^\s]+)/g);
    if (tagMatches) {
      task.tags = tagMatches.map(match => match.substring(1));
    }

    // Parse key:value attributes
    const kvMatches = remainingContent.match(/(\w+):([^\s]+)/g);
    if (kvMatches) {
      kvMatches.forEach(match => {
        const [key, value] = match.split(':');
        switch (key) {
          case 'cr':
            task.creationDate = value;
            break;
          case 'cm':
            task.completionDate = value;
            break;
          case 'due':
            task.dueDate = value;
            break;
          case 'rec':
            task.recurrence = value;
            break;
          default:
            if (!task.customAttributes) {
              task.customAttributes = {};
            }
            task.customAttributes[key] = value;
            break;
        }
      });
    }

    // Extract the main description (remove metadata)
    let description = remainingContent;
    description = description.replace(/\([A-Z]\)/g, '').trim(); // Remove priority
    description = description.replace(/\+[^\s]+/g, '').trim(); // Remove projects
    description = description.replace(/@[^\s]+/g, '').trim(); // Remove contexts
    description = description.replace(/#[^\s]+/g, '').trim(); // Remove tags
    description = description.replace(/\w+:[^\s]+/g, '').trim(); // Remove key:value pairs
    description = description.replace(/\s+/g, ' ').trim(); // Normalize whitespace

    task.description = description;

    return task;
  }

  serialize(tasks: Task[]): string {
    const lines: string[] = [];
    
    // Add header
    lines.push('# To-Do List\n');
    lines.push('## Tasks\n');

    tasks.forEach(task => {
      const indent = '  '.repeat(task.level);
      const status = task.completed ? 'x' : (task.cancelled ? '-' : ' ');
      
      let taskLine = `${indent}- [${status}] `;
      
      // Add priority
      if (task.priority) {
        taskLine += `(${task.priority}) `;
      }
      
      // Add description
      taskLine += task.description;
      
      // Add projects
      if (task.projects && task.projects.length > 0) {
        taskLine += ' ' + task.projects.map(p => `+${p}`).join(' ');
      }
      
      // Add contexts
      if (task.contexts && task.contexts.length > 0) {
        taskLine += ' ' + task.contexts.map(c => `@${c}`).join(' ');
      }
      
      // Add tags
      if (task.tags && task.tags.length > 0) {
        taskLine += ' ' + task.tags.map(t => `#${t}`).join(' ');
      }
      
      // Add dates and recurrence
      if (task.creationDate) {
        taskLine += ` cr:${task.creationDate}`;
      }
      if (task.completionDate) {
        taskLine += ` cm:${task.completionDate}`;
      }
      if (task.dueDate) {
        taskLine += ` due:${task.dueDate}`;
      }
      if (task.recurrence) {
        taskLine += ` rec:${task.recurrence}`;
      }
      
      // Add custom attributes
      if (task.customAttributes) {
        Object.entries(task.customAttributes).forEach(([key, value]) => {
          taskLine += ` ${key}:${value}`;
        });
      }
      
      lines.push(taskLine);
    });

    return lines.join('\n');
  }
}