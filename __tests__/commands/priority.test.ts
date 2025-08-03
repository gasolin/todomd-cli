import { setupTestDirectory, cleanupTestDirectory, addTask, execPromise, cliPath } from '../helpers';
import fs from 'fs/promises';
import path from 'path';

describe('priority command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await setupTestDirectory();
  });

  afterEach(async () => {
    if (tempDir) {
      await cleanupTestDirectory(tempDir);
    }
  });

  test('should set priority for a task', async () => {
    await addTask(tempDir, "A task that needs priority");

    const { stdout } = await execPromise(`node ${cliPath} priority 1 A`, { env: { ...process.env, TODO_DIR: tempDir } });
    expect(stdout).toContain('Priority for task 1 set to (A)');

    const todoFilePath = path.join(tempDir, 'todo.md');
    const fileContent = await fs.readFile(todoFilePath, 'utf8');
    expect(fileContent).toContain('(A) A task that needs priority');
  });
});
