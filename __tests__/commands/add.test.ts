import {
  setupTestDirectory,
  cleanupTestDirectory,
  addTask,
  listTasks
} from '../helpers'
import fs from 'fs/promises'
import path from 'path'

describe('add command', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    if (tempDir) {
      await cleanupTestDirectory(tempDir)
    }
  })

  test('should add a task to the todo file', async () => {
    const taskDescription = 'A new task to be added'
    const { stdout } = await addTask(tempDir, taskDescription)

    expect(stdout).toContain('Task added successfully')

    const todoFilePath = path.join(tempDir, 'todo.md')
    const fileContent = await fs.readFile(todoFilePath, 'utf8')
    expect(fileContent).toContain(`- [ ] ${taskDescription}`)
  })
})
