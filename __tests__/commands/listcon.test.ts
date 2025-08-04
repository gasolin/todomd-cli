import {
  setupTestDirectory,
  cleanupTestDirectory,
  execPromise,
  cliPath,
  addTask
} from '../helpers'

describe('listcon command', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('should list only tasks with the specified context', async () => {
    // 1. Add tasks with different contexts
    await addTask(tempDir, 'A task @work')
    await addTask(tempDir, 'Another task @home')
    await addTask(tempDir, 'A third task @work')

    // 2. Run listcon command
    const { stdout } = await execPromise(`node ${cliPath} listcon work`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })

    // 3. Verify the output
    expect(stdout).toContain('A task @work')
    expect(stdout).toContain('A third task @work')
    expect(stdout).not.toContain('Another task @home')
  })

  test('should show a message if no tasks match the context', async () => {
    await addTask(tempDir, 'A task @work')

    const { stdout } = await execPromise(
      `node ${cliPath} listcon nonexistent`,
      { env: { ...process.env, TODO_DIR: tempDir } }
    )
    expect(stdout).toContain('No tasks found for context "@nonexistent"')
  })

  test('should list all unique contexts when no context is specified', async () => {
    await addTask(tempDir, 'A task @work')
    await addTask(tempDir, 'Another task @home')
    await addTask(tempDir, 'A third task @work')

    const { stdout } = await execPromise(`node ${cliPath} listcon`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })

    expect(stdout).toContain('@work')
    expect(stdout).toContain('@home')
  })
})
