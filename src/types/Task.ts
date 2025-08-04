export enum Status {
  Todo = 'todo',
  InProgress = 'inprogress',
  Done = 'done',
  Cancelled = 'cancelled'
}

export interface Task {
  id?: number
  lineNumber?: number
  description: string
  status: Status
  priority?: string
  projects?: string[]
  contexts?: string[]
  creationDate?: string
  completionDate?: string
  dueDate?: string
  recurrence?: string
  customAttributes?: Record<string, string>
  tags?: string[]
  level: number // indentation level for subtasks
  parent?: number // parent task ID for hierarchical structure
  children?: number[] // child task IDs
  rawLine?: string // original line from markdown
}
