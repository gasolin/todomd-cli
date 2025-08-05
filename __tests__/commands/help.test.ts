import { execPromise, cliPath } from '../helpers'

describe('help command', () => {
  test('should display the help message', async () => {
    const { stdout } = await execPromise(`node ${cliPath} --help`)

    // Check for key sections in the help output
    expect(stdout).toContain('Usage')
    expect(stdout).toContain('$ todomd [path/to/your/todo.md]')
    expect(stdout).toContain('Commands')
    expect(stdout).toContain('Options')
    expect(stdout).toContain('Examples')

    // Check for a few specific commands to ensure the list is present
    expect(stdout).toContain('add, a <task>')
    expect(stdout).toContain('list, ls [search terms]')
    expect(stdout).not.toContain('listall, lsa')
    expect(stdout).toContain('Spec Reference')
  })

  test('should display the help message with -h alias', async () => {
    const { stdout } = await execPromise(`node ${cliPath} -h`)
    expect(stdout).toContain('Usage')
    expect(stdout).toContain('Commands')
    expect(stdout).toContain('Options')
  })
})
