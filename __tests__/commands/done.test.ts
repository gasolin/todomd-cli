import {
  setupTestDirectory,
  cleanupTestDirectory,
  addTask,
  execPromise,
  cliPath
} from '../helpers'
import fs from 'fs/promises'
import path from 'path'
import { TodoParser } from '../../src/lib/TodoParser'
import { Status } from '../../src/types/Task'

describe('done command', () => {
  let tempDir: string
  const parser = new TodoParser()

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    if (tempDir) {
      await cleanupTestDirectory(tempDir)
    }
  })

  test('should mark a task as done and set completion date', async () => {
    await addTask(tempDir, 'This task will be marked as done')

    const { stdout } = await execPromise(`node ${cliPath} done 1`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('Task completed')

    const todoFilePath = path.join(tempDir, 'todo.md')
    const fileContent = await fs.readFile(todoFilePath, 'utf8')
    const tasks = parser.parse(fileContent)

    expect(tasks[0].status).toBe(Status.Done)
    expect(tasks[0].completionDate).toBe(new Date().toISOString().split('T')[0])
  })
})
