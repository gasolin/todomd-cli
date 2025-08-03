import { setupTestDirectory, cleanupTestDirectory, addTask, listTasks } from '../helpers';

describe('list command', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await setupTestDirectory();
  });

  afterEach(async () => {
    if (tempDir) {
      await cleanupTestDirectory(tempDir);
    }
  });

  test('should list all tasks with line breaks', async () => {
    const task1 = "First task in list";
    const task2 = "Second task in list";
    await addTask(tempDir, task1);
    await addTask(tempDir, task2);

    const { stdout } = await listTasks(tempDir);

    expect(stdout).toContain('First task in list');
    expect(stdout).toContain('Second task in list');
    expect(stdout).toContain('\n');
  });

  test('should show a message when no tasks are present', async () => {
    const { stdout } = await listTasks(tempDir);
    expect(stdout).toContain('No tasks found.');
  });
});

