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

  // Handle Task[] output for lists
  if (Array.isArray(output)) {
    if (output.length === 0) {
      return <Text color='magenta'>No tasks found.</Text>
    }

    const maxDigits = String(output.length).length

    return (
      <Box flexDirection='column'>
        {output.map((task, index) => {
          let statusSymbol = '  ' // Default to two spaces for alignment
          if (task.status === Status.Done) {
            statusSymbol = '✓ ' 
          } else if (task.status === Status.Cancelled) {
            statusSymbol = '✗ ' 
          } else if (task.status === Status.InProgress) {
            statusSymbol = '~ ' 
          }

          const serializedTask = parser.serialize([task])
          // Remove the markdown list prefix, status, and the header
          const taskDescription = serializedTask.replace(
            /# To-Do List\n\n## Tasks\n\n- \[[ x~-]\] /,
            ''
          )

          const taskNumber = String(index + 1).padStart(maxDigits, ' ')
          const numberedTaskLine = `${taskNumber}. ${statusSymbol}${taskDescription}`

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
      </Box>
    )
  }

  return <Text color='red'>Invalid output type.</Text>
}

export default App
