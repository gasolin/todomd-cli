import {
  setupTestDirectory,
  cleanupTestDirectory,
  addTask,
  execPromise,
  cliPath
} from '../helpers'
import fs from 'fs/promises'
import path from 'path'

describe('priority command', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    if (tempDir) {
      await cleanupTestDirectory(tempDir)
    }
  })

  test('should set priority A for a task', async () => {
    await addTask(tempDir, 'A task that needs priority')

    const { stdout } = await execPromise(`node ${cliPath} priority 1 A`, {
      env: { ...process.env, TODOMD_DIR: tempDir }
    })
    expect(stdout).toContain('Priority for task 1 set to (A)')

    const todoFilePath = path.join(tempDir, 'todo.md')
    const fileContent = await fs.readFile(todoFilePath, 'utf8')
    expect(fileContent).toContain('(A) A task that needs priority')
  })

  test('should set priority B for a task', async () => {
    await addTask(tempDir, 'A task that needs priority')

    const { stdout } = await execPromise(`node ${cliPath} priority 1 B`, {
      env: { ...process.env, TODOMD_DIR: tempDir }
    })
    expect(stdout).toContain('Priority for task 1 set to (B)')

    const todoFilePath = path.join(tempDir, 'todo.md')
    const fileContent = await fs.readFile(todoFilePath, 'utf8')
    expect(fileContent).toContain('(B) A task that needs priority')
  })
})
