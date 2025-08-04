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

describe('undone command', () => {
  let tempDir: string
  const parser = new TodoParser()

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('should mark a completed task as not completed', async () => {
    // 1. Add a task
    const taskDescription = 'A task to be undone'
    await addTask(tempDir, taskDescription)

    // 2. Mark the task as done
    await execPromise(`node ${cliPath} done 1`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })

    // 3. Mark the task as undone
    const { stdout } = await execPromise(`node ${cliPath} undone 1`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('Task marked as incomplete')

    // 4. Verify the task status
    const todoFilePath = path.join(tempDir, 'todo.md')
    const fileContent = await fs.readFile(todoFilePath, 'utf8')
    const tasks = parser.parse(fileContent)

    expect(tasks[0].status).toBe(Status.Todo)
    expect(tasks[0].completionDate).toBeUndefined()
  })
})
