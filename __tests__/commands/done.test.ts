import { setupTestDirectory, cleanupTestDirectory, addTask, execPromise, cliPath } from '../helpers';
import fs from 'fs/promises';
import path from 'path';

describe('done command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await setupTestDirectory();
  });

  afterEach(async () => {
    if (tempDir) {
      await cleanupTestDirectory(tempDir);
    }
  });

  test('should mark a task as done', async () => {
    const taskDescription = "This task will be marked as done";
    await addTask(tempDir, taskDescription);

    const { stdout } = await execPromise(`node ${cliPath} done 1`, { env: { ...process.env, TODO_DIR: tempDir } });
    expect(stdout).toContain('Task completed');

    const todoFilePath = path.join(tempDir, 'todo.md');
    const fileContent = await fs.readFile(todoFilePath, 'utf8');
    expect(fileContent).toContain(`- [x] ${taskDescription}`);
  });
});
