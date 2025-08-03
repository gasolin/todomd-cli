import { setupTestDirectory, cleanupTestDirectory, addTask, execPromise, cliPath } from '../helpers';
import fs from 'fs/promises';
import path from 'path';

describe('project command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await setupTestDirectory();
  });

  afterEach(async () => {
    if (tempDir) {
      await cleanupTestDirectory(tempDir);
    }
  });

  test('should add a project to a task', async () => {
    await addTask(tempDir, "A task for a project");

    const { stdout } = await execPromise(`node ${cliPath} project 1 my-project`, { env: { ...process.env, TODO_DIR: tempDir } });
    expect(stdout).toContain('Project +my-project added to task 1');

    const todoFilePath = path.join(tempDir, 'todo.md');
    const fileContent = await fs.readFile(todoFilePath, 'utf8');
    expect(fileContent).toContain('A task for a project +my-project');
  });
});
