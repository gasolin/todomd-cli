import {
  setupTestDirectory,
  cleanupTestDirectory,
  addTask,
  execPromise,
  cliPath
} from '../helpers'

describe('search command', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    if (tempDir) {
      await cleanupTestDirectory(tempDir)
    }
  })

  test('should find tasks matching the search term', async () => {
    await addTask(tempDir, 'A special task to find')
    await addTask(tempDir, 'Another task')

    const { stdout } = await execPromise(`node ${cliPath} search "special"`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })

    expect(stdout).toContain('A special task to find')
    expect(stdout).not.toContain('Another task')
  })

  test('should show a message if no tasks match', async () => {
    await addTask(tempDir, 'A task')

    const { stdout } = await execPromise(
      `node ${cliPath} search "nonexistent"`,
      { env: { ...process.env, TODO_DIR: tempDir } }
    )

    expect(stdout).toContain('No tasks found.')
  })
})
