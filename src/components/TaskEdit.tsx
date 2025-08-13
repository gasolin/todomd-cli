import React, { useState } from 'react'
import { Box, Text, useApp, useInput } from 'ink'
import { TodoManager } from '../lib/TodoManager.js'
import { Task } from '../types/Task.js'

interface TaskEditProps {
  todoManager: TodoManager
  task: Task
  onSave: () => void
  onError: (message: string) => void
}

export const TaskEdit: React.FC<TaskEditProps> = ({
  todoManager,
  task,
  onSave,
  onError
}) => {
  const [description, setDescription] = useState(task.description)
  const { exit } = useApp()

  useInput((input, key) => {
    if (key.escape) {
      exit()
      return
    }

    if (key.return) {
      if (task.id === undefined) {
        onError('Cannot update a task without an ID.')
        exit()
        return
      }
      const updatedTask = { ...task, description }
      todoManager
        .updateTask(task.id, updatedTask)
        .then(() => {
          onSave()
          exit()
        })
        .catch((err) => {
          onError(err.message)
          exit()
        })
      return
    }

    if (key.backspace || key.delete) {
      setDescription((d) => d.slice(0, -1))
    } else {
      setDescription((d) => d + input)
    }
  })

  return (
    <Box flexDirection='column'>
      <Text>
        Editing Task {task.id !== undefined ? task.id + 1 : 'N/A'}: (Press Enter
        to save, Esc to cancel)
      </Text>
      <Box borderStyle='round' paddingX={1}>
        <Text>{description}</Text>
      </Box>
    </Box>
  )
}
