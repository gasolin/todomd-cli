import {
  setupTestDirectory,
  cleanupTestDirectory,
  execPromiseWithSpawn,
  cliPath,
  addTask
} from '../helpers'
import { format } from 'date-fns'

describe('color output', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('should display tasks with priority A in light yellow', async () => {
    await addTask(tempDir, '(A) A high priority task')
    const { stdout } = await execPromiseWithSpawn(`node ${cliPath} list`, {
      env: { ...process.env, TODOMD_DIR: tempDir, FORCE_COLOR: '3' }
    })
    expect(stdout).toContain('\u001b[38;2;255;255;153m')
  })

  test('should display tasks with priority B in light green', async () => {
    await addTask(tempDir, '(B) A medium priority task')
    const { stdout } = await execPromiseWithSpawn(`node ${cliPath} list`, {
      env: { ...process.env, TODOMD_DIR: tempDir, FORCE_COLOR: '3' }
    })
    expect(stdout).toContain('\u001b[38;2;144;238;144m')
  })

  test('should display tasks with priority C in light blue', async () => {
    await addTask(tempDir, '(C) A low priority task')
    const { stdout } = await execPromiseWithSpawn(`node ${cliPath} list`, {
      env: { ...process.env, TODOMD_DIR: tempDir, FORCE_COLOR: '3' }
    })
    expect(stdout).toContain('\u001b[38;2;173;216;230m')
  })

  test('should display tasks with a near due date in light orange', async () => {
    const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')
    await addTask(tempDir, `A task due tomorrow due:${tomorrow}`)
    const { stdout } = await execPromiseWithSpawn(`node ${cliPath} list`, {
      env: { ...process.env, TODOMD_DIR: tempDir, FORCE_COLOR: '3' }
    })
    expect(stdout).toContain('\u001b[38;2;255;213;128m')
  })

  test('should prioritize due date color over priority color', async () => {
    const tomorrow = format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')
    await addTask(
      tempDir,
      `(A) A high priority task due tomorrow due:${tomorrow}`
    )
    const { stdout } = await execPromiseWithSpawn(`node ${cliPath} list`, {
      env: { ...process.env, TODOMD_DIR: tempDir, FORCE_COLOR: '3' }
    })
    expect(stdout).toContain('\u001b[38;2;255;213;128m')
    expect(stdout).not.toContain('\u001b[38;2;255;255;153m')
  })
})
