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

  test('should align task numbers correctly when there are more than 9 tasks', async () => {
    // Add 11 tasks
    for (let i = 1; i <= 11; i++) {
      await addTask(tempDir, `Task ${i}`);
    }

    const { stdout } = await listTasks(tempDir);
    const lines = stdout.split('\n');

    // Task 1 should be padded with a space
    expect(lines.find(line => line.includes('Task 1'))).toMatch(/^ 1\. \[ \] Task 1/);
    // Task 10 should not be padded
    expect(lines.find(line => line.includes('Task 10'))).toMatch(/^10\. \[ \] Task 10/);
    // Task 11 should not be padded
    expect(lines.find(line => line.includes('Task 11'))).toMatch(/^11\. \[ \] Task 11/);
  });
});

