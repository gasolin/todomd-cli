import {
  setupTestDirectory,
  cleanupTestDirectory,
  addTask,
  execPromise,
  cliPath
} from '../helpers'
import fs from 'fs/promises'
import path from 'path'

describe('project command', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test.each([['test'], ['my-project']])(
    'should add a project with name "%s" to a task',
    async (projectName) => {
      await addTask(tempDir, 'A task for a project')

      const { stdout } = await execPromise(
        `node ${cliPath} project 1 ${projectName}`,
        { env: { ...process.env, TODO_DIR: tempDir } }
      )
      expect(stdout).toContain(`Project +${projectName} added to task 1`)

      const todoFilePath = path.join(tempDir, 'todo.md')
      const fileContent = await fs.readFile(todoFilePath, 'utf8')
      expect(fileContent).toContain(`A task for a project +${projectName}`)
    }
  )

  test('should add a Chinese project to a task', async () => {
    await addTask(tempDir, '一個帶有中文專案的任務')

    const { stdout } = await execPromise(`node ${cliPath} project 1 工作`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('Project +工作 added to task 1')

    const todoFilePath = path.join(tempDir, 'todo.md')
    const fileContent = await fs.readFile(todoFilePath, 'utf8')
    expect(fileContent).toContain('一個帶有中文專案的任務 +工作')
  })
})
