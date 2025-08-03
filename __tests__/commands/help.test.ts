import { execPromise, cliPath } from '../helpers';

describe('help command', () => {
  test('should display the help message', async () => {
    const { stdout } = await execPromise(`node ${cliPath} --help`);

    // Check for key sections in the help output
    expect(stdout).toContain('Usage');
    expect(stdout).toContain('Commands');
    expect(stdout).toContain('Options');
    expect(stdout).toContain('Examples');
    
    // Check for a few specific commands to ensure the list is present
    expect(stdout).toContain('add <task>');
    expect(stdout).toContain('list, ls');
  });
});
