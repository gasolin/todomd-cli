import {
  setupTestDirectory,
  cleanupTestDirectory,
  execPromise,
  cliPath
} from '../helpers'
import fs from 'fs/promises'
import path from 'path'

describe('list command', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('should list only tasks with Todo or InProgress status', async () => {
    const todoFilePath = path.join(tempDir, 'todo.md')
    // Note: The parser now correctly handles the `status:inprogress` tag,
    // but the cleaner way is to use the `~` symbol.
    const fileContent = `- [ ] A task to do
- [~] A task in progress
- [x] A completed task
- [-] A cancelled task`
    await fs.writeFile(todoFilePath, fileContent)

    const { stdout } = await execPromise(`node ${cliPath} list`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })

    expect(stdout).toContain('A task to do')
    expect(stdout).toContain('A task in progress')
    expect(stdout).not.toContain('A completed task')
    expect(stdout).not.toContain('A cancelled task')
  })
})
