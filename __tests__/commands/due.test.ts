import {
  setupTestDirectory,
  cleanupTestDirectory,
  execPromise,
  cliPath,
  addTask
} from '../helpers'

describe('due command', () => {
  let tempDir: string
  const dateRegex = /\d{4}-\d{2}-\d{2}/ // YYYY-MM-DD

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
    await addTask(tempDir, 'A task to set due date on')
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('should set due date with YYYY-MM-DD format', async () => {
    const date = '2025-12-25'
    const { stdout } = await execPromise(`node ${cliPath} due 1 ${date}`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain(`Due date for task 1 set to ${date}`)
  })

  test('should set due date with "today"', async () => {
    const { stdout } = await execPromise(`node ${cliPath} due 1 today`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toMatch(/Due date for task 1 set to \d{4}-\d{2}-\d{2}/)
  })

  test('should set due date with "TOMORROW" (uppercase)', async () => {
    const { stdout } = await execPromise(`node ${cliPath} due 1 TOMORROW`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toMatch(/Due date for task 1 set to \d{4}-\d{2}-\d{2}/)
  })

  test('should set due date with "in 2 weeks"', async () => {
    const { stdout } = await execPromise(`node ${cliPath} due 1 "in 2 weeks"`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toMatch(/Due date for task 1 set to \d{4}-\d{2}-\d{2}/)
  })

  test('should set due date with "Next Friday" (mixed case)', async () => {
    const { stdout } = await execPromise(
      `node ${cliPath} due 1 "Next Friday"`,
      {
        env: { ...process.env, TODO_DIR: tempDir }
      }
    )
    expect(stdout).toMatch(/Due date for task 1 set to \d{4}-\d{2}-\d{2}/)
  })

  test('should set due date with "saturday" (weekday only)', async () => {
    const { stdout } = await execPromise(`node ${cliPath} due 1 "saturday"`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toMatch(/Due date for task 1 set to \d{4}-\d{2}-\d{2}/)
  })

  test('should set due date with "this saturday"', async () => {
    const { stdout } = await execPromise(
      `node ${cliPath} due 1 "this saturday"`,
      {
        env: { ...process.env, TODO_DIR: tempDir }
      }
    )
    expect(stdout).toMatch(/Due date for task 1 set to \d{4}-\d{2}-\d{2}/)
  })

  test('should set due date with "next saturday"', async () => {
    const { stdout } = await execPromise(
      `node ${cliPath} due 1 "next saturday"`,
      {
        env: { ...process.env, TODO_DIR: tempDir }
      }
    )
    expect(stdout).toMatch(/Due date for task 1 set to \d{4}-\d{2}-\d{2}/)
  })

  test('should show error for invalid date format', async () => {
    const { stdout } = await execPromise(
      `node ${cliPath} due 1 "invalid-date"`,
      {
        env: { ...process.env, TODO_DIR: tempDir }
      }
    )
    expect(stdout).toContain(
      'Error: Date must be in YYYY-MM-DD format or a supported keyword'
    )
  })
})
