import { getListTasks } from '../src/lib/TaskLister'
import { Task, Status } from '../src/types/Task'
import { ValidCommands } from '../src/types/Commands'

const mockTasks: Task[] = [
  {
    id: 0,
    description: 'Task one +projA @ctxA',
    status: Status.Todo,
    level: 0,
    projects: ['projA'],
    contexts: ['ctxA'],
    tags: [],
    customAttributes: {}
  },
  {
    id: 1,
    description: 'Task two +projB @ctxB',
    status: Status.InProgress,
    level: 0,
    projects: ['projB'],
    contexts: ['ctxB'],
    tags: [],
    customAttributes: {}
  },
  {
    id: 2,
    description: 'Task three +projA @ctxB',
    status: Status.Done,
    level: 0,
    projects: ['projA'],
    contexts: ['ctxB'],
    tags: [],
    customAttributes: {}
  },
  {
    id: 3,
    description: 'Task four +projC @ctxA',
    status: Status.Cancelled,
    level: 0,
    projects: ['projC'],
    contexts: ['ctxA'],
    tags: [],
    customAttributes: {}
  }
]

describe('TaskLister', () => {
  test('should list only incomplete tasks for "list" command', () => {
    const result = getListTasks(ValidCommands.List, [], mockTasks)
    expect(Array.isArray(result)).toBe(true)
    const tasks = result as Task[]
    expect(tasks).toHaveLength(4)
    expect(tasks[0].id).toBe(0)
    expect(tasks[1].id).toBe(1)
    expect(tasks[2].id).toBe(2)
    expect(tasks[3].id).toBe(3)
  })

  test('should list all tasks for "listall" command', () => {
    const result = getListTasks(ValidCommands.ListAll, [], mockTasks)
    expect(Array.isArray(result)).toBe(true)
    const tasks = result as Task[]
    expect(tasks).toHaveLength(4)
  })

  test('should filter tasks by project for "listproj" command', () => {
    const result = getListTasks(ValidCommands.ListProj, ['+projA'], mockTasks)
    expect(Array.isArray(result)).toBe(true)
    const tasks = result as Task[]
    expect(tasks).toHaveLength(2)
    expect(tasks[0].id).toBe(0)
    expect(tasks[1].id).toBe(2)
  })

  test('should list all unique projects if no project is specified', () => {
    const result = getListTasks(ValidCommands.ListProj, [], mockTasks)
    expect(typeof result).toBe('string')
    expect(result).toContain('+projA')
    expect(result).toContain('+projB')
    expect(result).toContain('+projC')
  })

  test('should filter tasks by context for "listcon" command', () => {
    const result = getListTasks(ValidCommands.ListCon, ['@ctxB'], mockTasks)
    expect(Array.isArray(result)).toBe(true)
    const tasks = result as Task[]
    expect(tasks).toHaveLength(2)
    expect(tasks[0].id).toBe(1)
    expect(tasks[1].id).toBe(2)
  })

  test('should list all unique contexts if no context is specified', () => {
    const result = getListTasks(ValidCommands.ListCon, [], mockTasks)
    expect(typeof result).toBe('string')
    expect(result).toContain('@ctxA')
    expect(result).toContain('@ctxB')
  })

  test('should search tasks by term', () => {
    const result = getListTasks(ValidCommands.Search, ['two'], mockTasks)
    expect(Array.isArray(result)).toBe(true)
    const tasks = result as Task[]
    expect(tasks).toHaveLength(1)
    expect(tasks[0].id).toBe(1)
  })
})
