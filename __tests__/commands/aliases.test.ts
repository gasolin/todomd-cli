import {
  setupTestDirectory,
  cleanupTestDirectory,
  execPromise,
  cliPath
} from '../helpers'
import fs from 'fs/promises'
import path from 'path'

describe('Command Aliases', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await setupTestDirectory()
  })

  afterEach(async () => {
    await cleanupTestDirectory(tempDir)
  })

  test('alias "a" should work for "add"', async () => {
    const taskDescription = 'Task added via alias'
    const { stdout } = await execPromise(
      `node ${cliPath} a "${taskDescription}"`,
      { env: { ...process.env, TODO_DIR: tempDir } }
    )
    expect(stdout).toContain('Task added successfully')
    const fileContent = await fs.readFile(path.join(tempDir, 'todo.md'), 'utf8')
    expect(fileContent).toContain(taskDescription)
  })

  test('alias "do" should work for "done"', async () => {
    await execPromise(`node ${cliPath} add "Task to be done"`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    const { stdout } = await execPromise(`node ${cliPath} do 1`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('Task completed')
    const fileContent = await fs.readFile(path.join(tempDir, 'todo.md'), 'utf8')
    expect(fileContent).toContain('- [x] Task to be done')
  })

  test('alias "del" should work for "delete"', async () => {
    await execPromise(`node ${cliPath} add "Task to be deleted"`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    const { stdout } = await execPromise(`node ${cliPath} del 1`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('Task deleted')
    const fileContent = await fs.readFile(path.join(tempDir, 'todo.md'), 'utf8')
    expect(fileContent).not.toContain('Task to be deleted')
  })

  test('alias "rm" should work for "delete"', async () => {
    await execPromise(`node ${cliPath} add "Another task to be removed"`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    const { stdout } = await execPromise(`node ${cliPath} rm 1`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('Task deleted')
    const fileContent = await fs.readFile(path.join(tempDir, 'todo.md'), 'utf8')
    expect(fileContent).not.toContain('Another task to be removed')
  })

  test('alias "ud" should work for "undone"', async () => {
    await execPromise(`node ${cliPath} add "Task to be undone"`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    await execPromise(`node ${cliPath} done 1`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    const { stdout } = await execPromise(`node ${cliPath} ud 1`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('Task marked as incomplete')
    const fileContent = await fs.readFile(path.join(tempDir, 'todo.md'), 'utf8')
    expect(fileContent).toContain('- [ ] Task to be undone')
  })

  test('alias "pri" should work for "priority"', async () => {
    await execPromise(`node ${cliPath} add "A task for priority alias"`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    const { stdout } = await execPromise(`node ${cliPath} pri 1 B`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('Priority for task 1 set to (B)')
    const fileContent = await fs.readFile(path.join(tempDir, 'todo.md'), 'utf8')
    expect(fileContent).toContain('(B) A task for priority alias')
  })

  test('alias "proj" should work for "project"', async () => {
    await execPromise(`node ${cliPath} add "A task for project alias"`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    const { stdout } = await execPromise(`node ${cliPath} proj 1 alias-proj`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('Project +alias-proj added to task 1')
    const fileContent = await fs.readFile(path.join(tempDir, 'todo.md'), 'utf8')
    expect(fileContent).toContain('A task for project alias +alias-proj')
  })

  test('alias "ctx" should work for "context"', async () => {
    await execPromise(`node ${cliPath} add "A task for context alias"`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    const { stdout } = await execPromise(`node ${cliPath} ctx 1 alias-ctx`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('Context @alias-ctx added to task 1')
    const fileContent = await fs.readFile(path.join(tempDir, 'todo.md'), 'utf8')
    expect(fileContent).toContain('A task for context alias @alias-ctx')
  })

  test('alias "ls" should work for "list"', async () => {
    await execPromise(`node ${cliPath} add "A task for the ls alias"`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    const { stdout } = await execPromise(`node ${cliPath} ls`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('A task for the ls alias')
  })

  test('alias "lsa" should work for "listall"', async () => {
    await execPromise(`node ${cliPath} add "Incomplete task for lsa"`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    await execPromise(`node ${cliPath} add "Completed task for lsa"`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    await execPromise(`node ${cliPath} done 2`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })

    const { stdout } = await execPromise(`node ${cliPath} lsa`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('Incomplete task for lsa')
    expect(stdout).toContain('Completed task for lsa')
  })

  test('alias "lsc" should work for "listcon"', async () => {
    await execPromise(`node ${cliPath} add "A task for lsc @work"`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    const { stdout } = await execPromise(`node ${cliPath} lsc work`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('A task for lsc @work')
  })

  test('alias "lsp" should work for "listpri"', async () => {
    await execPromise(`node ${cliPath} add "(A) A task for lsp"`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    const { stdout } = await execPromise(`node ${cliPath} lsp A`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('(A) A task for lsp')
  })

  test('alias "lsproj" should work for "listproj"', async () => {
    await execPromise(`node ${cliPath} add "A task for lsproj +work"`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    const { stdout } = await execPromise(`node ${cliPath} lsproj work`, {
      env: { ...process.env, TODO_DIR: tempDir }
    })
    expect(stdout).toContain('A task for lsproj +work')
  })
})
