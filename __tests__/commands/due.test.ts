import {
  setupTestDirectory,
  cleanupTestDirectory,
  addTask,
  execPromise,
  cliPath
} from '../helpers'
import fs from 'fs/promises'
import path from 'path'

describe('due command', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('should set a due date for a task', async () => {
    await addTask(tempDir, 'A task with a due date')

    const { stdout } = await execPromise(`node ${cliPath} due 1 2025-12-31`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('Due date for task 1 set to 2025-12-31')

    const todoFilePath = path.join(tempDir, 'todo.md')
    const fileContent = await fs.readFile(todoFilePath, 'utf8')
    expect(fileContent).toMatch(/A task with a due date.*due:2025-12-31/)
  })
})
