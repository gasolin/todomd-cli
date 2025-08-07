import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'

/**
 * Validates a string to ensure it's a safe and existing file path.
 *
 * The function performs three main checks:
 * 1.  Detects common shell command operators and command names.
 * 2.  Handles file paths with spaces, including quoted paths.
 * 3.  Verifies the path exists on the file system and points to a file,
 * not a directory.
 *
 * @param command The string to be validated.
 * @returns A Promise that resolves to true if the string is a valid, existing file path; false otherwise.
 */
async function isValidFilePath(command: string): Promise<boolean> {
  // 1. Check for forbidden shell operators and commands
  const forbiddenOperators = [
    '|',
    '&&',
    '||',
    ';',
    '$',
    '`',
    '>',
    '<',
    '>>',
    '&',
    '(',
    ')',
    '{',
    '}'
  ]
  const forbiddenCommands = [
    'echo',
    'curl',
    'wget',
    'grep',
    'awk',
    'sed',
    'cat',
    'ls',
    'cp',
    'mv',
    'rm',
    'mkdir',
    'touch',
    'find',
    'sort',
    'uniq',
    'head',
    'tail',
    'git',
    'npm',
    'yarn',
    'docker',
    'ssh',
    'scp'
  ]

  // Check for any forbidden operators in the raw string.
  if (forbiddenOperators.some((op) => command.includes(op))) {
    return false
  }

  // A simple regex to split the command while respecting quotes.
  const parts = command.match(/".*?"|[^"\s]+/g)

  // An empty or malformed string is not a valid path.
  if (!parts || parts.length === 0) {
    return false
  }

  // The first part is the potential command or file path.
  const potentialPath = parts[0].replace(/['"]/g, '')

  // Check if the first part is a forbidden command.
  if (forbiddenCommands.includes(potentialPath.toLowerCase())) {
    return false
  }

  // If there are multiple parts, and the string wasn't fully quoted,
  // it's likely a command with arguments.
  // For example, "node script.js" will have parts.length > 1.
  // A quoted path like "'my file.txt'" will only have one part.
  if (parts.length > 1) {
    return false
  }

  try {
    await fs.access(command)
    const stats = await fs.stat(command)
    return stats.isFile()
  } catch {
    return false
  }
}

export async function runScript(
  command: string,
  taskDescription: string
): Promise<string | null> {
  try {
    // Determine how to execute the script based on file extension
    let execCommand: string
    let args: string[]
    let useShell: boolean

    // Check if command is a file path or a shell command
    const isFilePath = await isValidFilePath(command)

    if (isFilePath) {
      // Handle file execution
      const stats = await fs.stat(command)
      if (process.platform !== 'win32') {
        // Check if file has execute permissions (user execute bit)
        if (!(stats.mode & parseInt('100', 8))) {
          console.warn(`Warning: File may not be executable: ${command}`)
        }
      }

      const ext = path.extname(command).toLowerCase()
      useShell = false

      switch (ext) {
        case '.js':
          execCommand = 'node'
          args = [command]
          break
        case '.sh':
          execCommand = 'bash'
          args = [command]
          break
        case '.py':
          execCommand = 'python'
          args = [command]
          break
        case '.ps1':
          execCommand = 'powershell'
          args = ['-File', command]
          break
        default:
          // Try to execute directly (for executable files or shebang scripts)
          execCommand = command
          args = []
      }
    } else {
      // Handle shell command - replace TASK_DESCRIPTION with actual value
      const expandedCommand = command.replace(/TASK_DESCRIPTION/g, `"${taskDescription.replace(/"/g, '\\"')}"`)
      useShell = true
      if (process.platform === 'win32') {
        execCommand = 'cmd'
        args = ['/c', expandedCommand]
      } else {
        execCommand = 'sh'
        // On Unix, export the variable and then run the command
        args = ['-c', expandedCommand]
      }
      console.log('Executing command:', expandedCommand)
    }

    // Execute the command
    const child = spawn(execCommand, args, {
      stdio: ['inherit', 'inherit', 'inherit'], // Pass through stdin, stdout, stderr
      shell: useShell || process.platform === 'win32', // Use shell on Windows
      env: { ...process.env, TASK_DESCRIPTION: taskDescription }
    })

    // Wait for the process to complete
    const exitCode = await new Promise<number | null>((resolve, reject) => {
      child.on('close', (code) => {
        resolve(code)
      })

      child.on('error', (error) => {
        reject(error)
      })
    })

    console.log(`Command execution completed, exit code: ${exitCode}`)
    return null // Success, no error
  } catch (error: any) {
    // Return the error message
    return `Error executing command ${command}: ${error.stderr || error.message}`
  }
}
