import { setupTestDirectory, cleanupTestDirectory, execPromise, cliPath } from '../helpers';
import fs from 'fs/promises';
import path from 'path';

describe('Path Handling', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await setupTestDirectory();
  });

  afterEach(async () => {
    await cleanupTestDirectory(tempDir);
  });

  test('should list tasks from a specific file path', async () => {
    const customTodoFile = path.join(tempDir, 'my-tasks.md');
    await fs.writeFile(customTodoFile, '- [ ] A task from a custom file');

    const { stdout } = await execPromise(`node ${cliPath} ${customTodoFile}`);
    expect(stdout).toContain('A task from a custom file');
  });

  test('should list tasks from todo.md in a specific directory', async () => {
    const customDir = path.join(tempDir, 'my-project');
    await fs.mkdir(customDir);
    const customTodoFile = path.join(customDir, 'todo.md');
    await fs.writeFile(customTodoFile, '- [ ] A task from a custom directory');

    const { stdout } = await execPromise(`node ${cliPath} ${customDir}`);
    expect(stdout).toContain('A task from a custom directory');
  });

  test('should list tasks from a file in the current directory by name', async () => {
    const customTodoFile = path.join(tempDir, 'README.md');
    await fs.writeFile(customTodoFile, '- [ ] A task from README.md');

    // Execute the command from within the temp directory
    const { stdout } = await execPromise(`node ${cliPath} README.md`, { cwd: tempDir });
    expect(stdout).toContain('A task from README.md');
  });

  test('should add a task to a specific file', async () => {
    const customTodoFile = path.join(tempDir, 'my-tasks.md');
    await fs.writeFile(customTodoFile, '- [ ] An existing task');

    const { stdout } = await execPromise(`node ${cliPath} ${customTodoFile} add "A new task"`);
    expect(stdout).toContain('Task added successfully');

    const fileContent = await fs.readFile(customTodoFile, 'utf8');
    expect(fileContent).toContain('An existing task');
    expect(fileContent).toContain('A new task');
  });
});