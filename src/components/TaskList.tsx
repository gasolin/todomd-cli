import React from 'react';
import { Task } from '../types/Task.js';
import { format } from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  title?: string;
  ink: any;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, title = 'Tasks', ink }) => {
  const { Box, Text } = ink;

  if (tasks.length === 0) {
    return (
      <Box flexDirection="column">
        <Text bold color="blue">{title}</Text>
        <Text color="gray">No tasks found.</Text>
      </Box>
    );
  }

  const formatTask = (task: Task, index: number) => {
    const indent = '  '.repeat(task.level);
    let taskText = `${indent}${index + 1}. `;
    
    // Status indicator
    if (task.completed) {
      taskText += '✓ ';
    } else if (task.cancelled) {
      taskText += '✕ ';
    } else {
      taskText += '○ ';
    }
    
    // Priority
    if (task.priority) {
      taskText += `(${task.priority}) `;
    }
    
    // Description
    taskText += task.description;
    
    // Projects
    if (task.projects && task.projects.length > 0) {
      taskText += ' ' + task.projects.map(p => `+${p}`).join(' ');
    }
    
    // Contexts
    if (task.contexts && task.contexts.length > 0) {
      taskText += ' ' + task.contexts.map(c => `@${c}`).join(' ');
    }
    
    // Tags
    if (task.tags && task.tags.length > 0) {
      taskText += ' ' + task.tags.map(t => `#${t}`).join(' ');
    }
    
    // Due date
    if (task.dueDate) {
      const isOverdue = new Date(task.dueDate) < new Date();
      taskText += isOverdue ? ` [DUE: ${task.dueDate}]` : ` [due: ${task.dueDate}]`;
    }
    
    // Recurrence
    if (task.recurrence) {
      taskText += ` [rec: ${task.recurrence}]`;
    }

    return taskText;
  };

  const getTaskColor = (task: Task) => {
    if (task.completed) return 'green';
    if (task.cancelled) return 'gray';
    if (task.dueDate && new Date(task.dueDate) < new Date()) return 'red';
    if (task.priority === 'A') return 'magenta';
    if (task.priority === 'B') return 'yellow';
    return 'white';
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="blue">{title}</Text>
      </Box>
      {tasks.map((task, index) => (
        <Text key={task.id || index} color={getTaskColor(task)}>
          {formatTask(task, index)}
        </Text>
      ))}
      <Box marginTop={1}>
        <Text color="gray">
          Total: {tasks.length} tasks | 
          Completed: {tasks.filter(t => t.completed).length} | 
          Pending: {tasks.filter(t => !t.completed && !t.cancelled).length}
        </Text>
      </Box>
    </Box>
  );
};

export default TaskList;