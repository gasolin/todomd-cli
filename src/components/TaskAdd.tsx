import React, { useEffect } from 'react';
import { TodoManager } from '../lib/TodoManager.js';

interface TaskAddProps {
  todoManager: TodoManager;
  taskText: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  ink: any;
}

const TaskAdd: React.FC<TaskAddProps> = ({ todoManager, taskText, onSuccess, onError, ink }) => {
  const { Text } = ink;

  useEffect(() => {
    const addTask = async () => {
      try {
        await todoManager.addTask(taskText);
        onSuccess();
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to add task');
      }
    };

    addTask();
  }, [todoManager, taskText, onSuccess, onError]);

  return <Text color="green">Adding task: "{taskText}"</Text>;
};

export default TaskAdd;