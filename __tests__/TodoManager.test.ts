import { TodoManager } from '../src/lib/TodoManager';
import { jest } from '@jest/globals';

// Mock the fs/promises module
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn(),
  access: jest.fn(),
}));

const fs = require('fs/promises');

describe('TodoManager', () => {
  let todoManager: TodoManager;
  const todoDir = '/home/user/.todomd';
  const todoFile = 'todo.md';
  const doneFile = 'done.md';

  beforeEach(() => {
    // Reset mocks before each test
    (fs.readFile as jest.Mock).mockClear();
    (fs.writeFile as jest.Mock).mockClear();
    (fs.mkdir as jest.Mock).mockClear();
    (fs.access as jest.Mock).mockClear();
    
    todoManager = new TodoManager(todoDir, todoFile, doneFile);
  });

  test('loadTasks should read and parse the todo file', async () => {
    const mockContent = '- [ ] Task 1\n- [x] Task 2';
    (fs.readFile as jest.Mock).mockResolvedValue(mockContent);

    const tasks = await todoManager.loadTasks();

    expect(fs.readFile).toHaveBeenCalledWith(`${todoDir}/${todoFile}`, 'utf8');
    expect(tasks).toHaveLength(2);
    expect(tasks[0].description).toBe('Task 1');
    expect(tasks[1].completed).toBe(true);
  });

  test('loadTasks should handle file not found error', async () => {
    const error = new Error('File not found') as any;
    error.code = 'ENOENT';
    (fs.readFile as jest.Mock).mockRejectedValue(error);
    
    const tasks = await todoManager.loadTasks();
    
    expect(tasks).toEqual([]);
  });

  test('addTask should add a new task and save the file', async () => {
    const initialContent = '- [ ] Existing task';
    (fs.readFile as jest.Mock).mockResolvedValue(initialContent);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    await todoManager.loadTasks(); // Load initial tasks
    await todoManager.addTask('New task');

    const tasks = todoManager.getTasks();
    expect(tasks).toHaveLength(2);
    expect(tasks[1].description).toBe('New task');
    expect(fs.writeFile).toHaveBeenCalled();
  });

  test('updateTask should modify a task and save', async () => {
    const initialContent = '- [ ] Task to update';
    (fs.readFile as jest.Mock).mockResolvedValue(initialContent);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    await todoManager.loadTasks();
    const taskToUpdate = todoManager.getTasks()[0];
    taskToUpdate.completed = true;
    
    await todoManager.updateTask(0, taskToUpdate);

    const tasks = todoManager.getTasks();
    expect(tasks[0].completed).toBe(true);
    expect(fs.writeFile).toHaveBeenCalled();
  });

  test('deleteTask should remove a task and save', async () => {
    const initialContent = '- [ ] Task 1\n- [ ] Task to delete\n- [ ] Task 3';
    (fs.readFile as jest.Mock).mockResolvedValue(initialContent);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    await todoManager.loadTasks();
    await todoManager.deleteTask(1); // Delete the second task

    const tasks = todoManager.getTasks();
    expect(tasks).toHaveLength(2);
    expect(tasks[0].description).toBe('Task 1');
    expect(tasks[1].description).toBe('Task 3');
    expect(fs.writeFile).toHaveBeenCalled();
  });
  
  test('init should create directory and files', async () => {
    (fs.access as jest.Mock).mockRejectedValue(new Error('Dir not found')); // Simulate directory doesn't exist
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

    await todoManager.init();

    expect(fs.mkdir).toHaveBeenCalledWith(todoDir, { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledWith(`${todoDir}/${todoFile}`, expect.any(String), 'utf8');
    expect(fs.writeFile).toHaveBeenCalledWith(`${todoDir}/${doneFile}`, expect.any(String), 'utf8');
  });
});