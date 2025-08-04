import { setupTestDirectory, cleanupTestDirectory, execPromise, cliPath, addTask } from '../helpers';

describe('listproj command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await setupTestDirectory();
  });

  afterEach(async () => {
    await cleanupTestDirectory(tempDir);
  });

  test('should list only tasks with the specified project', async () => {
    // 1. Add tasks with different projects
    await addTask(tempDir, "A task +work");
    await addTask(tempDir, "Another task +home");
    await addTask(tempDir, "A third task +work");

    // 2. Run listproj command
    const { stdout } = await execPromise(`node ${cliPath} listproj work`, { env: { ...process.env, TODO_DIR: tempDir } });

    // 3. Verify the output
    expect(stdout).toContain('A task +work');
    expect(stdout).toContain('A third task +work');
    expect(stdout).not.toContain('Another task +home');
  });

  test('should show a message if no tasks match the project', async () => {
    await addTask(tempDir, "A task +work");

    const { stdout } = await execPromise(`node ${cliPath} listproj nonexistent`, { env: { ...process.env, TODO_DIR: tempDir } });
    expect(stdout).toContain('No tasks found for project "+nonexistent"');
  });

  test('should list all unique projects when no project is specified', async () => {
    await addTask(tempDir, "A task +work");
    await addTask(tempDir, "Another task +home");
    await addTask(tempDir, "A third task +work");

    const { stdout } = await execPromise(`node ${cliPath} listproj`, { env: { ...process.env, TODO_DIR: tempDir } });

    expect(stdout).toContain('+work');
    expect(stdout).toContain('+home');
  });
});