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

describe('archive command', () => {
  let tempDir: string
  const parser = new TodoParser()

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('should move tasks with status Done to done.md', async () => {
    // 1. Add tasks
    await addTask(tempDir, 'Incomplete task')
    await addTask(tempDir, 'Completed task')

    // 2. Mark one as done
    await execPromise(`node ${cliPath} done 2`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })

    // 3. Run archive command
    const { stdout } = await execPromise(`node ${cliPath} archive`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('Completed tasks archived')

    // 4. Verify todo.md
    const todoFilePath = path.join(tempDir, 'todo.md')
    const todoFileContent = await fs.readFile(todoFilePath, 'utf8')
    const todoTasks = parser.parse(todoFileContent)
    expect(todoTasks.some((t) => t.description === 'Incomplete task')).toBe(
      true
    )
    expect(todoTasks.some((t) => t.description === 'Completed task')).toBe(
      false
    )

    // 5. Verify done.md
    const doneFilePath = path.join(tempDir, 'done.md')
    const doneFileContent = await fs.readFile(doneFilePath, 'utf8')
    const doneTasks = parser.parse(doneFileContent)
    const archivedTask = doneTasks.find((t) =>
      t.description.includes('Completed task')
    )
    expect(archivedTask).toBeDefined()
    expect(archivedTask?.status).toBe(Status.Done)
  })
})
