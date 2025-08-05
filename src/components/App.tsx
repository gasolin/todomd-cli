import React, { useState, useEffect } from 'react'
import { Commander } from '../lib/Commander'
import { Task, Status } from '../types/Task'
import { ValidCommands } from '../types/Commands'
import { TodoParser } from '../lib/TodoParser'
import { parseISO, isPast, differenceInDays } from 'date-fns'

interface AppProps {
  command: string
  args: string[]
  flags: any
  todoDir: string
}

type AppStatus = 'loading' | 'success' | 'error'

const App: React.FC<AppProps> = ({ command, args, flags, todoDir }) => {
  const [appStatus, setAppStatus] = useState<AppStatus>('loading')
  const [output, setOutput] = useState<string | Task[] | null>(null)
  const [Ink, setInk] = useState<any>(null)
  const [parser] = useState(() => new TodoParser())

  const isConxtOrProject = (command: string) =>
    command === ValidCommands.ListCon ||
    command === ValidCommands.ListConAlias ||
    command === ValidCommands.ListProj ||
    command === ValidCommands.ListProjAlias

  useEffect(() => {
    const loadInk = async () => {
      const ink = await import('ink')
      setInk(ink)
    }
    loadInk()
  }, [])

  useEffect(() => {
    if (!Ink) return

    const run = async () => {
      try {
        const commander = new Commander(todoDir, flags.file, flags.doneFile)
        const result = await commander.run(command, args)
        setOutput(result)
        setAppStatus('success')
      } catch (err) {
        setOutput(
          err instanceof Error ? err.message : 'An unknown error occurred'
        )
        setAppStatus('error')
      }
    }

    run()
  }, [Ink, command, args, flags, todoDir])

  if (appStatus === 'loading' || !Ink) {
    return null
  }

  const { Text, Box } = Ink
  // Handle string output for messages
  if (typeof output === 'string') {
    let color = 'green'
    if (
      appStatus === 'error' ||
      output.startsWith('No tasks found') ||
      output.startsWith('No contexts found') ||
      output.startsWith('No projects found')
    ) {
      color = 'magenta'
    } else if (isConxtOrProject(command)) {
      color = 'white'
    }
    return <Text color={color}>{output}</Text>
  }

  const isNearDay = (dueDate: string): boolean => {
    const nearDays = parseInt(process.env.TODO_NEAR_DAYS || '2', 10)
    const date = parseISO(dueDate)
    return differenceInDays(date, new Date()) <= nearDays
  }

  const formatTaskLine = (task: Task): string => {
    let line = ''
    if (task.priority) {
      line += `(${task.priority}) `
    }
    line += task.description
    if (task.projects && task.projects.length > 0) {
      line += ` ${task.projects.map((p) => `+${p}`).join(' ')}`
    }
    if (task.contexts && task.contexts.length > 0) {
      line += ` ${task.contexts.map((c) => `@${c}`).join(' ')}`
    }
    if (task.dueDate) {
      line += ` due:${task.dueDate}`
    }
    return line
  }

  // Handle Task[] output for lists
  if (Array.isArray(output)) {
    if (output.length === 0) {
      if (
        (command === ValidCommands.List ||
          command === ValidCommands.ListAlias) &&
        args.length > 0
      ) {
        return (
          <Text color='magenta'>
            No tasks found matching "{args.join(' ')}"
          </Text>
        )
      }
      if (
        command === ValidCommands.ListProj ||
        command === ValidCommands.ListProjAlias
      ) {
        return (
          <Text color='magenta'>No tasks found for project "+{args[0]}"</Text>
        )
      }
      if (
        command === ValidCommands.ListCon ||
        command === ValidCommands.ListConAlias
      ) {
        return (
          <Text color='magenta'>No tasks found for context "@{args[0]}"</Text>
        )
      }
      return <Text color='magenta'>No tasks found.</Text>
    }
    const maxDigits = String(output.length).length

    return (
      <Box flexDirection='column'>
        {output.map((task, index) => {
          let statusSymbol = '  ' // Default for alignment
          if (task.status === Status.Done) statusSymbol = '✓ '
          else if (task.status === Status.Cancelled) statusSymbol = '✗ '
          else if (task.status === Status.InProgress) statusSymbol = '~ '

          let prefix = ''
          if (task.level > 0) {
            const indent = '   '.repeat(task.level - 1)
            let isLastSibling = true
            for (let i = index + 1; i < output.length; i++) {
              if (output[i].level < task.level) break
              if (output[i].level === task.level) {
                isLastSibling = false
                break
              }
            }
            const branch = isLastSibling ? '└─ ' : '├─ '
            prefix = ` ${indent}${branch}`
          }

          const taskDescription = formatTaskLine(task)
          const taskNumber = String(index + 1).padStart(maxDigits, ' ')
          const numberedTaskLine = `${taskNumber}. ${statusSymbol}${prefix}${taskDescription}`

          let color
          if (task.status === Status.Done || task.status === Status.Cancelled) {
            color = 'gray'
          } else if (task.dueDate) {
            const dueDate = parseISO(task.dueDate)
            if (isPast(dueDate)) {
              color = 'red'
            } else if (isNearDay(task.dueDate)) {
              color = 'yellow'
            }
          }

          // For listcon and listproj, we want to keep the default color
          if (isConxtOrProject(command)) {
            color = 'white'
          }

          return (
            <Text key={index} color={color}>
              {numberedTaskLine}
            </Text>
          )
        })}
        <Box marginTop={1}>
          <Text>
            -- TODO:{' '}
            {
              output.filter(
                (t) =>
                  t.status === Status.Todo || t.status === Status.InProgress
              ).length
            }
            {' | '}
            DONE: {output.filter((t) => t.status === Status.Done).length}
            {' | '}
            TOTAL: {output.length}
          </Text>
        </Box>
      </Box>
    )
  }

  return <Text color='red'>Invalid output type.</Text>
}

export default App
