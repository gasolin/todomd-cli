import { setupTestDirectory, cleanupTestDirectory, execPromise, cliPath, addTask } from '../helpers';
import fs from 'fs/promises';
import path from 'path';

describe('listall command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await setupTestDirectory();
  });

  afterEach(async () => {
    await cleanupTestDirectory(tempDir);
  });

  test('should list all tasks, including completed and cancelled ones', async () => {
    // 1. Add tasks
    await addTask(tempDir, "Incomplete task");
    await addTask(tempDir, "Completed task");
    await addTask(tempDir, "Cancelled task");

    // 2. Mark one as done and one as cancelled
    await execPromise(`node ${cliPath} done 2`, { env: { ...process.env, TODO_DIR: tempDir } });
    // We need to manually edit the file for cancelled tasks as there's no command yet
    const todoFilePath = path.join(tempDir, 'todo.md');
    let fileContent = await fs.readFile(todoFilePath, 'utf8');
    fileContent = fileContent.replace('- [ ] Cancelled task', '- [-] Cancelled task');
    await fs.writeFile(todoFilePath, fileContent);

    // 3. Run listall command
    const { stdout } = await execPromise(`node ${cliPath} listall`, { env: { ...process.env, TODO_DIR: tempDir } });

    // 4. Verify the output
    expect(stdout).toContain('Incomplete task');
    expect(stdout).toContain('Completed task');
    expect(stdout).toContain('Cancelled task');
  });
});
