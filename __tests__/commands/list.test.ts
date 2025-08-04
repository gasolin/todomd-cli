import {
  setupTestDirectory,
  cleanupTestDirectory,
  execPromise,
  cliPath,
  addTask
} from '../helpers'
import fs from 'fs/promises'
import path from 'path'

describe('list command', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('should list all tasks regardless of status', async () => {
    const todoFilePath = path.join(tempDir, 'todo.md')
    const fileContent = `- [ ] A task to do
- [~] A task in progress
- [x] A completed task
- [-] A cancelled task`
    await fs.writeFile(todoFilePath, fileContent)

    const { stdout } = await execPromise(`node ${cliPath} list`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })

    expect(stdout).toContain('A task to do')
    expect(stdout).toContain('A task in progress')
    expect(stdout).toContain('A completed task')
    expect(stdout).toContain('A cancelled task')

    // Verify summary
    expect(stdout).toContain('TODO: 2')
    expect(stdout).toContain('DONE: 1')
    expect(stdout).toContain('TOTAL: 4')
  })

  test('should list all tasks with full metadata', async () => {
    // 1. Add tasks with various metadata
    await addTask(tempDir, 'Incomplete task +project1 @context1')
    await addTask(tempDir, 'Completed task due:2025-12-31')
    await addTask(tempDir, 'Cancelled task')

    // 2. Mark one as done and one as cancelled
    await execPromise(`node ${cliPath} done 2`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    const todoFilePath = path.join(tempDir, 'todo.md')
    let fileContent = await fs.readFile(todoFilePath, 'utf8')
    fileContent = fileContent.replace(
      '- [ ] Cancelled task',
      '- [-] Cancelled task'
    )
    await fs.writeFile(todoFilePath, fileContent)

    // 3. Run listall command
    const { stdout } = await execPromise(`node ${cliPath} list`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })

    // 4. Verify the output contains all tasks and their metadata
    expect(stdout).toContain('+project1')
    expect(stdout).toContain('@context1')
    expect(stdout).toContain('due:2025-12-31')
    expect(stdout).toContain('Cancelled task')
  })

  test('should display a tree structure for tasks with subtasks', async () => {
    const todoFilePath = path.join(tempDir, 'todo.md')
    const fileContent = `- [ ] Parent task
  - [ ] Subtask 1
  - [ ] Subtask 2`
    await fs.writeFile(todoFilePath, fileContent)

    const { stdout } = await execPromise(`node ${cliPath} list`, {
      env: { ...process.env, TODO_DIR: tempDir },
    })

    // Parent task should have no prefix
    expect(stdout).toContain('Parent task')
    expect(stdout).not.toContain('├─ Parent task')
    expect(stdout).not.toContain('└─ Parent task')

    // Subtasks should have the correct prefixes and spacing
    expect(stdout).toContain(' ├─ Subtask 1')
    expect(stdout).toContain(' └─ Subtask 2')
  })
})
