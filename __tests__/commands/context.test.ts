import {
  setupTestDirectory,
  cleanupTestDirectory,
  addTask,
  execPromise,
  cliPath
} from '../helpers'
import fs from 'fs/promises'
import path from 'path'

describe('context command', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('should add a context to a task', async () => {
    await addTask(tempDir, 'A task with a context')

    const { stdout } = await execPromise(`node ${cliPath} context 1 office`, {
      env: { ...process.env, TODOMD_DIR: tempDir }
    })
    expect(stdout).toContain('Context @office added to task 1')

    const todoFilePath = path.join(tempDir, 'todo.md')
    const fileContent = await fs.readFile(todoFilePath, 'utf8')
    expect(fileContent).toContain('A task with a context @office')
  })

  test('should add a Chinese context to a task', async () => {
    await addTask(tempDir, '一個帶有中文情境的任務')

    const { stdout } = await execPromise(`node ${cliPath} context 1 家`, {
      env: { ...process.env, TODOMD_DIR: tempDir }
    })
    expect(stdout).toContain('Context @家 added to task 1')

    const todoFilePath = path.join(tempDir, 'todo.md')
    const fileContent = await fs.readFile(todoFilePath, 'utf8')
    expect(fileContent).toContain('一個帶有中文情境的任務 @家')
  })
})
