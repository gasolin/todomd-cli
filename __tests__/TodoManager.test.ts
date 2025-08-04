import { setupTestDirectory, cleanupTestDirectory, addTask } from './helpers'
import { TodoManager } from '../src/lib/TodoManager'
import { Status } from '../src/types/Task'
import fs from 'fs/promises'
import path from 'path'

describe('TodoManager', () => {
  let tempDir: string
  let todoManager: TodoManager

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
    todoManager = new TodoManager(tempDir)
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('loadTasks should read and parse the todo file', async () => {
    const todoFilePath = path.join(tempDir, 'todo.md')
    const fileContent = `- [ ] Task 1
- [x] Task 2`
    await fs.writeFile(todoFilePath, fileContent)

    const tasks = await todoManager.loadTasks()
    expect(tasks).toHaveLength(2)
    expect(tasks[0].description).toBe('Task 1')
    expect(tasks[1].status).toBe(Status.Done)
  })

  test('loadTasks should handle file not found error by returning an empty array', async () => {
    // Point to a directory that doesn't exist
    const nonExistentManager = new TodoManager('/non/existent/dir')
    const tasks = await nonExistentManager.loadTasks()
    expect(tasks).toEqual([])
  })

  test('updateTask should correctly modify a task and set completionDate', async () => {
    await addTask(tempDir, 'Initial task')
    await todoManager.loadTasks() // Load the initial task

    // Update the task to be 'Done'
    await todoManager.updateTask(0, {
      description: 'Updated description',
      status: Status.Done
    })

    const updatedTasks = todoManager.getTasks()
    expect(updatedTasks[0].description).toBe('Updated description')
    expect(updatedTasks[0].status).toBe(Status.Done)
    expect(updatedTasks[0].completionDate).toBeDefined()
    expect(updatedTasks[0].completionDate).toBe(
      new Date().toISOString().split('T')[0]
    )
  })
})
