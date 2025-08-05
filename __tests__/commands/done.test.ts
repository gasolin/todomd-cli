import {
  setupTestDirectory,
  cleanupTestDirectory,
  execPromise,
  cliPath,
  addTask
} from '../helpers'
import fs from 'fs/promises'
import path from 'path'

describe('done command', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('should mark a task as done', async () => {
    await addTask(tempDir, 'A task to be completed')

    const { stdout } = await execPromise(`node ${cliPath} done 1`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('Task completed')

    const todoFilePath = path.join(tempDir, 'todo.md')
    const fileContent = await fs.readFile(todoFilePath, 'utf8')
    expect(fileContent).toContain('- [x] A task to be completed')
  })

  test('should execute TODO_CMD_WHEN_DONE and pass task description', async () => {
    const taskDescription = 'A task to trigger the command'
    await addTask(tempDir, taskDescription)

    const tempOutputFile = path.join(tempDir, 'output.txt')
    const command = `echo "$TASK_DESCRIPTION" > ${tempOutputFile}`

    await execPromise(`node ${cliPath} done 1`, {
      env: {
        ...process.env,
        TODO_DIR: tempDir,
        TODO_CMD_WHEN_DONE: command
      }
    })

    // Allow a moment for the async exec to complete and write the file
    await new Promise((resolve) => setTimeout(resolve, 100))

    const outputContent = await fs.readFile(tempOutputFile, 'utf8')
    expect(outputContent.trim()).toBe(taskDescription)
  })
})
