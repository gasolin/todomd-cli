import {
  setupTestDirectory,
  cleanupTestDirectory,
  execPromise,
  cliPath,
  addTask
} from '../helpers'
import fs from 'fs/promises'
import path from 'path'

describe('listall command', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('should list all tasks with full metadata', async () => {
    // 1. Add tasks with various metadata
    await addTask(tempDir, 'Incomplete task +project1 @context1')
    await addTask(tempDir, 'Completed task due:2025-12-31')
    await addTask(tempDir, 'Cancelled task')

    // 2. Mark one as done and one as cancelled
    await execPromise(`node ${cliPath} done 2`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    const todoFilePath = path.join(tempDir, 'todo.md')
    let fileContent = await fs.readFile(todoFilePath, 'utf8')
    fileContent = fileContent.replace(
      '- [ ] Cancelled task',
      '- [-] Cancelled task'
    )
    await fs.writeFile(todoFilePath, fileContent)

    // 3. Run listall command
    const { stdout } = await execPromise(`node ${cliPath} listall`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })

    // 4. Verify the output contains all tasks and their metadata
    expect(stdout).toContain('+project1')
    expect(stdout).toContain('@context1')
    expect(stdout).toContain('due:2025-12-31')
    expect(stdout).toContain('Cancelled task')
  })
})
