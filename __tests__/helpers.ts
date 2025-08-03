import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'

export const execPromise = promisify(exec)
export const cliPath = path.join(__dirname, '..', 'dist', 'index.js')

export async function setupTestDirectory(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'todomd-cli-test-'))
  // Run init by default for most tests
  await execPromise(`node ${cliPath} init`, {
    env: { ...process.env, TODO_DIR: tempDir }
  })
  return tempDir
}

export async function cleanupTestDirectory(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true })
}

export async function addTask(dir: string, task: string): Promise<any> {
  return execPromise(`node ${cliPath} add "${task}"`, {
    env: { ...process.env, TODO_DIR: dir }
  })
}

export async function listTasks(dir: string): Promise<any> {
  return execPromise(`node ${cliPath} list`, {
    env: { ...process.env, TODO_DIR: dir }
  })
}
