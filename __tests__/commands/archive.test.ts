import {
  setupTestDirectory,
  cleanupTestDirectory,
  addTask,
  execPromise,
  cliPath
} from '../helpers'
import fs from 'fs/promises'
import path from 'path'

describe('archive command', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('should move completed tasks from todo.md to done.md', async () => {
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
    expect(todoFileContent).toContain('Incomplete task')
    expect(todoFileContent).not.toContain('Completed task')

    // 5. Verify done.md
    const doneFilePath = path.join(tempDir, 'done.md')
    const doneFileContent = await fs.readFile(doneFilePath, 'utf8')
    expect(doneFileContent).toContain('- [x] Completed task')
  })
})
