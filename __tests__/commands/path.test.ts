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
});
