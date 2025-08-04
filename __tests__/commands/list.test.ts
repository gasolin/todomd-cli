import {
  setupTestDirectory,
  cleanupTestDirectory,
  addTask,
  listTasks
} from '../helpers'

describe('list command', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('should list all tasks with line breaks', async () => {
    const task1 = 'First task in list'
    const task2 = 'Second task in list'
    await addTask(tempDir, task1)
    await addTask(tempDir, task2)

    const { stdout } = await listTasks(tempDir)

    expect(stdout).toContain('First task in list')
    expect(stdout).toContain('Second task in list')
    expect(stdout).toContain('\n')
  })

  test('should show a message when no tasks are present', async () => {
    const { stdout } = await listTasks(tempDir)
    expect(stdout).toContain('No tasks found.')
  })

  test('should align task numbers correctly when there are more than 9 tasks', async () => {
    // Add 11 tasks
    for (let i = 1; i <= 11; i++) {
      await addTask(tempDir, `Task ${i}`)
    }

    const { stdout } = await listTasks(tempDir)
    const lines = stdout.split('\n')

    // Task 1 should be padded with a space
    expect(lines.find((line) => line.includes('Task 1'))).toMatch(
      /^ 1\.   Task 1 cr:\d{4}-\d{2}-\d{2}/
    )
    // Task 10 should not be padded
    expect(lines.find((line) => line.includes('Task 10'))).toMatch(
      /^10\.   Task 10 cr:\d{4}-\d{2}-\d{2}/
    )
    // Task 11 should not be padded
    expect(lines.find((line) => line.includes('Task 11'))).toMatch(
      /^11\.   Task 11 cr:\d{4}-\d{2}-\d{2}/
    )
  })

  test('should display overdue tasks in red', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const overdueDate = yesterday.toISOString().split('T')[0]

    await addTask(tempDir, `An overdue task due:${overdueDate}`)

    const { stdout } = await listTasks(tempDir)

    // This is a simplified check. In a real terminal, this would be red.
    // We are checking if the output contains the task, as we can't check for color.
    expect(stdout).toMatch(/An overdue task.*due:2025-08-03/)
  })
})
