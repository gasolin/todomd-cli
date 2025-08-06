import {
  setupTestDirectory,
  cleanupTestDirectory,
  addTask,
  execPromise,
  cliPath
} from '../helpers'
import fs from 'fs/promises'
import path from 'path'

describe('delete command', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    if (tempDir) {
      await cleanupTestDirectory(tempDir)
    }
  })

  test('should delete a task from the todo file', async () => {
    await addTask(tempDir, 'First task to keep')
    await addTask(tempDir, 'Second task to delete')

    const { stdout } = await execPromise(`node ${cliPath} delete 2`, {
      env: { ...process.env, TODOMD_DIR: tempDir }
    })
    expect(stdout).toContain('Task deleted')

    const todoFilePath = path.join(tempDir, 'todo.md')
    const fileContent = await fs.readFile(todoFilePath, 'utf8')
    expect(fileContent).toContain('First task to keep')
    expect(fileContent).not.toContain('Second task to delete')
  })
})
