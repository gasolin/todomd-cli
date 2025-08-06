import { execPromise, cliPath, cleanupTestDirectory } from '../helpers'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

describe('init command', () => {
  let tempDir: string

  beforeEach(async () => {
    // For init, we want a fresh directory that does NOT exist yet
    tempDir = path.join(os.tmpdir(), `todomd-cli-test-${Date.now()}`)
  })

  afterEach(async () => {
    if (tempDir) {
      await cleanupTestDirectory(tempDir)
    }
  })

  test('should initialize the todomd directory and files', async () => {
    const { stdout } = await execPromise(`node ${cliPath} init`, {
      env: { ...process.env, TODOMD_DIR: tempDir }
    })

    expect(stdout).toContain('TodoMD directory initialized')

    const todoFilePath = path.join(tempDir, 'todo.md')
    const doneFilePath = path.join(tempDir, 'done.md')

    await expect(fs.access(todoFilePath)).resolves.toBeUndefined()
    await expect(fs.access(doneFilePath)).resolves.toBeUndefined()
  })
})
