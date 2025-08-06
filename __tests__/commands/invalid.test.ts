import {
  setupTestDirectory,
  cleanupTestDirectory,
  execPromise,
  cliPath
} from '../helpers'
import fs from 'fs/promises'
import path from 'path'

describe('Invalid Command', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('should show an error for an unknown command', async () => {
    const { stdout } = await execPromise(`node ${cliPath} foobar`, {
      env: { ...process.env, TODOMD_DIR: tempDir }
    })
    expect(stdout).toContain('Error: Unknown command "foobar"')
    expect(stdout).toContain(
      "Run 'todomd --help' to see a list of available commands."
    )
  })

  test('should show an error for an unknown command after a valid path', async () => {
    // Create a dummy file to act as a valid path
    await fs.writeFile(path.join(tempDir, 'todo.md'), '- [ ] a task')

    // Run from within the tempDir so 'todo.md' is a valid relative path
    const { stdout } = await execPromise(`node ${cliPath} todo.md baz`, {
      cwd: tempDir
    })
    expect(stdout).toContain('Error: Unknown command "baz"')
  })
})
