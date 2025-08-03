import React, { useEffect, useState } from 'react';
import { TodoManager } from '../lib/TodoManager.js';
import { Task } from '../types/Task.js';
import TaskList from './TaskList.js';
import TaskAdd from './TaskAdd.js';
import TaskEdit from './TaskEdit.js';
import Init from './Init.js';

interface AppProps {
  command: string;
  args: string[];
  flags: any;
  todoDir: string;
  ink: any;
}

const App: React.FC<AppProps> = ({ command, args, flags, todoDir, ink }) => {
  const { Box, Text } = ink;
  const [todoManager] = useState(() => new TodoManager(todoDir, flags.file, flags.doneFile));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const loadTasks = async () => {
    try {
      const loadedTasks = await todoManager.loadTasks();
      setTasks(loadedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    }
  };

  useEffect(() => {
    if (command !== 'init') {
      loadTasks();
    }
  }, []);

  const handleTaskUpdate = () => {
    loadTasks();
    setSuccess('Task updated successfully');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const renderCommand = () => {
    switch (command) {
      case 'init':
        return <Init todoDir={todoDir} onSuccess={() => setSuccess('TodoMD directory initialized')} onError={handleError} ink={ink} />;
      
      case 'add':
        const taskText = args.join(' ');
        if (!taskText) {
          return <Text color="red">Error: Please provide a task description</Text>;
        }
        return <TaskAdd todoManager={todoManager} taskText={taskText} onSuccess={handleTaskUpdate} onError={handleError} ink={ink} />;
      
      case 'done':
        return handleToggleTask(args[0], true);
      
      case 'undone':
        return handleToggleTask(args[0], false);
      
      case 'delete':
      case 'rm':
        return handleDeleteTask(args[0]);
      
      case 'edit':
        const taskId = parseInt(args[0]);
        if (!taskId || !tasks[taskId - 1]) {
          return <Text color="red">Error: Invalid task ID</Text>;
        }
        return <TaskEdit 
          todoManager={todoManager} 
          task={tasks[taskId - 1]} 
          taskIndex={taskId - 1}
          onSuccess={handleTaskUpdate} 
          onError={handleError} 
          ink={ink}
        />;
      
      case 'priority':
      case 'pri':
        return handleSetPriority(args[0], args[1]);
      
      case 'project':
      case 'proj':
        return handleAddProject(args[0], args[1]);
      
      case 'context':
      case 'ctx':
        return handleAddContext(args[0], args[1]);
      
      case 'search':
        const searchTerm = args.join(' ');
        if (!searchTerm) {
          return <Text color="red">Error: Please provide a search term</Text>;
        }
        const filteredTasks = tasks.filter(task => 
          task.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return <TaskList tasks={filteredTasks} title={`Search results for "${searchTerm}"`} ink={ink} />;
      
      case 'due':
        return handleSetDue(args[0], args[1]);
      
      case 'list':
      case 'ls':
      default:
        return <TaskList tasks={tasks} title="Tasks" ink={ink} />;
    }
  };

  const handleToggleTask = (taskIdStr: string, completed: boolean) => {
    const taskId = parseInt(taskIdStr);
    if (!taskId || !tasks[taskId - 1]) {
      return <Text color="red">Error: Invalid task ID</Text>;
    }

    const updatedTask = { ...tasks[taskId - 1], completed };
    
    try {
      todoManager.updateTask(taskId - 1, updatedTask);
      handleTaskUpdate();
      return <Text color="green">Task {completed ? 'completed' : 'marked as incomplete'}</Text>;
    } catch (err) {
      return <Text color="red">Error: {err instanceof Error ? err.message : 'Failed to update task'}</Text>;
    }
  };

  const handleDeleteTask = (taskIdStr: string) => {
    const taskId = parseInt(taskIdStr);
    if (!taskId || !tasks[taskId - 1]) {
      return <Text color="red">Error: Invalid task ID</Text>;
    }

    try {
      todoManager.deleteTask(taskId - 1);
      handleTaskUpdate();
      return <Text color="green">Task deleted</Text>;
    } catch (err) {
      return <Text color="red">Error: {err instanceof Error ? err.message : 'Failed to delete task'}</Text>;
    }
  };

  const handleSetPriority = (taskIdStr: string, priority: string) => {
    const taskId = parseInt(taskIdStr);
    if (!taskId || !tasks[taskId - 1]) {
      return <Text color="red">Error: Invalid task ID</Text>;
    }
    if (!priority || !/^[A-Z]$/.test(priority)) {
      return <Text color="red">Error: Priority must be a single uppercase letter (A-Z)</Text>;
    }

    const updatedTask = { ...tasks[taskId - 1], priority };
    
    try {
      todoManager.updateTask(taskId - 1, updatedTask);
      handleTaskUpdate();
      return <Text color="green">Priority set to {priority}</Text>;
    } catch (err) {
      return <Text color="red">Error: {err instanceof Error ? err.message : 'Failed to set priority'}</Text>;
    }
  };

  const handleAddProject = (taskIdStr: string, project: string) => {
    const taskId = parseInt(taskIdStr);
    if (!taskId || !tasks[taskId - 1]) {
      return <Text color="red">Error: Invalid task ID</Text>;
    }
    if (!project) {
      return <Text color="red">Error: Please provide a project name</Text>;
    }

    const task = tasks[taskId - 1];
    const projects = task.projects || [];
    if (!projects.includes(project)) {
      projects.push(project);
    }
    const updatedTask = { ...task, projects };
    
    try {
      todoManager.updateTask(taskId - 1, updatedTask);
      handleTaskUpdate();
      return <Text color="green">Project "{project}" added</Text>;
    } catch (err) {
      return <Text color="red">Error: {err instanceof Error ? err.message : 'Failed to add project'}</Text>;
    }
  };

  const handleAddContext = (taskIdStr: string, context: string) => {
    const taskId = parseInt(taskIdStr);
    if (!taskId || !tasks[taskId - 1]) {
      return <Text color="red">Error: Invalid task ID</Text>;
    }
    if (!context) {
      return <Text color="red">Error: Please provide a context name</Text>;
    }

    const task = tasks[taskId - 1];
    const contexts = task.contexts || [];
    if (!contexts.includes(context)) {
      contexts.push(context);
    }
    const updatedTask = { ...task, contexts };
    
    try {
      todoManager.updateTask(taskId - 1, updatedTask);
      handleTaskUpdate();
      return <Text color="green">Context "@{context}" added</Text>;
    } catch (err) {
      return <Text color="red">Error: {err instanceof Error ? err.message : 'Failed to add context'}</Text>;
    }
  };

  const handleSetDue = (taskIdStr: string, dateStr: string) => {
    const taskId = parseInt(taskIdStr);
    if (!taskId || !tasks[taskId - 1]) {
      return <Text color="red">Error: Invalid task ID</Text>;
    }
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return <Text color="red">Error: Date must be in YYYY-MM-DD format</Text>;
    }

    const updatedTask = { ...tasks[taskId - 1], dueDate: dateStr };
    
    try {
      todoManager.updateTask(taskId - 1, updatedTask);
      handleTaskUpdate();
      return <Text color="green">Due date set to {dateStr}</Text>;
    } catch (err) {
      return <Text color="red">Error: {err instanceof Error ? err.message : 'Failed to set due date'}</Text>;
    }
  };

  return (
    <Box flexDirection="column">
      {error && (
        <Box marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}
      {success && (
        <Box marginBottom={1}>
          <Text color="green">{success}</Text>
        </Box>
      )}
      {renderCommand()}
    </Box>
  );
};

export default App;