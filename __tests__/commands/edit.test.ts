import {
  setupTestDirectory,
  cleanupTestDirectory,
  execPromise,
  cliPath,
  addTask,
} from '../helpers'
import fs from 'fs/promises'
import path from 'path'

describe('edit command', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
    await addTask(tempDir, 'A task to be edited')
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('should edit the description of a task', async () => {
    const newDescription = 'This is the new description'
    const { stdout } = await execPromise(
      `node ${cliPath} edit 1 "${newDescription}"`,
      {
        env: { ...process.env, TODO_DIR: tempDir },
      }
    )
    expect(stdout).toContain('Task updated successfully')

    const todoFilePath = path.join(tempDir, 'todo.md')
    const fileContent = await fs.readFile(todoFilePath, 'utf8')
    expect(fileContent).toContain(newDescription)
    expect(fileContent).not.toContain('A task to be edited')
  })

  test('should show an error for an invalid task ID', async () => {
    const { stdout } = await execPromise(
      `node ${cliPath} edit 99 "new description"`,
      {
        env: { ...process.env, TODO_DIR: tempDir },
      }
    )
    expect(stdout).toContain('Error: Invalid task ID')
  })

  test('should show an error if no new description is provided', async () => {
    const { stdout } = await execPromise(`node ${cliPath} edit 1`, {
      env: { ...process.env, TODO_DIR: tempDir },
    })
    expect(stdout).toContain(
      'Error: Please provide a new description for the task'
    )
  })
})
