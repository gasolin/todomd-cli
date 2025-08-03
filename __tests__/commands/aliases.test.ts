import { setupTestDirectory, cleanupTestDirectory, execPromise, cliPath } from '../helpers';
import fs from 'fs/promises';
import path from 'path';

describe('Command Aliases', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await setupTestDirectory();
  });

  afterEach(async () => {
    await cleanupTestDirectory(tempDir);
  });

  test('alias "a" should work for "add"', async () => {
    const taskDescription = "Task added via alias";
    const { stdout } = await execPromise(`node ${cliPath} a "${taskDescription}"`, { env: { ...process.env, TODO_DIR: tempDir } });
    expect(stdout).toContain('Task added successfully');
    const fileContent = await fs.readFile(path.join(tempDir, 'todo.md'), 'utf8');
    expect(fileContent).toContain(taskDescription);
  });

  test('alias "do" should work for "done"', async () => {
    await execPromise(`node ${cliPath} add "Task to be done"`, { env: { ...process.env, TODO_DIR: tempDir } });
    const { stdout } = await execPromise(`node ${cliPath} do 1`, { env: { ...process.env, TODO_DIR: tempDir } });
    expect(stdout).toContain('Task completed');
    const fileContent = await fs.readFile(path.join(tempDir, 'todo.md'), 'utf8');
    expect(fileContent).toContain('- [x] Task to be done');
  });

  test('alias "del" should work for "delete"', async () => {
    await execPromise(`node ${cliPath} add "Task to be deleted"`, { env: { ...process.env, TODO_DIR: tempDir } });
    const { stdout } = await execPromise(`node ${cliPath} del 1`, { env: { ...process.env, TODO_DIR: tempDir } });
    expect(stdout).toContain('Task deleted');
    const fileContent = await fs.readFile(path.join(tempDir, 'todo.md'), 'utf8');
    expect(fileContent).not.toContain('Task to be deleted');
  });

  test('alias "rm" should work for "delete"', async () => {
    await execPromise(`node ${cliPath} add "Another task to be removed"`, { env: { ...process.env, TODO_DIR: tempDir } });
    const { stdout } = await execPromise(`node ${cliPath} rm 1`, { env: { ...process.env, TODO_DIR: tempDir } });
    expect(stdout).toContain('Task deleted');
    const fileContent = await fs.readFile(path.join(tempDir, 'todo.md'), 'utf8');
    expect(fileContent).not.toContain('Another task to be removed');
  });

  test('alias "ud" should work for "undone"', async () => {
    await execPromise(`node ${cliPath} add "Task to be undone"`, { env: { ...process.env, TODO_DIR: tempDir } });
    await execPromise(`node ${cliPath} done 1`, { env: { ...process.env, TODO_DIR: tempDir } });
    const { stdout } = await execPromise(`node ${cliPath} ud 1`, { env: { ...process.env, TODO_DIR: tempDir } });
    expect(stdout).toContain('Task marked as incomplete');
    const fileContent = await fs.readFile(path.join(tempDir, 'todo.md'), 'utf8');
    expect(fileContent).toContain('- [ ] Task to be undone');
  });
});