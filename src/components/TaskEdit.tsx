import React, { useState } from 'react';
import { TodoManager } from '../lib/TodoManager.js';
import { Task } from '../types/Task.js';

interface TaskEditProps {
  todoManager: TodoManager;
  task: Task;
  taskIndex: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  ink: any;
}

const TaskEdit: React.FC<TaskEditProps> = ({ todoManager, task, taskIndex, onSuccess, onError, ink }) => {
  const { Box, Text, useInput } = ink;
  const [editedDescription, setEditedDescription] = useState(task.description);
  const [mode, setMode] = useState<'view' | 'edit'>('view');

  useInput((input: string, key: any) => {
    if (mode === 'view') {
      if (input === 'e') {
        setMode('edit');
      } else if (key.escape || input === 'q') {
        process.exit(0);
      }
    } else if (mode === 'edit') {
      if (key.return) {
        // Save changes
        const updatedTask = { ...task, description: editedDescription };
        todoManager.updateTask(taskIndex, updatedTask)
          .then(() => {
            onSuccess();
            setMode('view');
          })
          .catch(err => {
            onError(err instanceof Error ? err.message : 'Failed to update task');
          });
      } else if (key.escape) {
        // Cancel editing
        setEditedDescription(task.description);
        setMode('view');
      } else if (key.backspace) {
        setEditedDescription(prev => prev.slice(0, -1));
      } else if (input) {
        setEditedDescription(prev => prev + input);
      }
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold color="blue">Edit Task #{taskIndex + 1}</Text>
      <Box marginTop={1}>
        <Text>Status: </Text>
        <Text color={task.completed ? 'green' : 'yellow'}>
          {task.completed ? 'Completed' : 'Pending'}
        </Text>
      </Box>
      {task.priority && (
        <Box>
          <Text>Priority: </Text>
          <Text color="magenta">({task.priority})</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text>Description: </Text>
        {mode === 'edit' ? (
          <Text color="cyan">{editedDescription}_</Text>
        ) : (
          <Text>{task.description}</Text>
        )}
      </Box>
      {task.projects && task.projects.length > 0 && (
        <Box>
          <Text>Projects: </Text>
          <Text color="blue">{task.projects.map(p => `+${p}`).join(' ')}</Text>
        </Box>
      )}
      {task.contexts && task.contexts.length > 0 && (
        <Box>
          <Text>Contexts: </Text>
          <Text color="yellow">{task.contexts.map(c => `@${c}`).join(' ')}</Text>
        </Box>
      )}
      {task.dueDate && (
        <Box>
          <Text>Due Date: </Text>
          <Text color="red">{task.dueDate}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        {mode === 'view' ? (
          <Text color="gray">Press 'e' to edit, 'q' to quit</Text>
        ) : (
          <Text color="gray">Press Enter to save, Escape to cancel</Text>
        )}
      </Box>
    </Box>
  );
};

export default TaskEdit;