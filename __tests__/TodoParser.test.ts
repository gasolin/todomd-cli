import { TodoParser } from '../src/lib/TodoParser'
import { Status, Task } from '../src/types/Task'

describe('TodoParser', () => {
  const parser = new TodoParser()

  test('should parse a simple incomplete task', () => {
    const line = '- [ ] Buy milk'
    const task = parser.parseTaskLine(line, 0, 0)
    expect(task).toMatchObject({
      description: 'Buy milk',
      status: Status.Todo
    })
  })

  test('should parse a completed task', () => {
    const line = '- [x] Finish report'
    const task = parser.parseTaskLine(line, 0, 1)
    expect(task).toMatchObject({
      description: 'Finish report',
      status: Status.Done
    })
  })

  test('should parse an in-progress task', () => {
    const line = '- [~] Working on the feature'
    const task = parser.parseTaskLine(line, 0, 2)
    expect(task).toMatchObject({
      description: 'Working on the feature',
      status: Status.InProgress
    })
  })

  test('should parse a cancelled task', () => {
    const line = '- [-] This task was cancelled'
    const task = parser.parseTaskLine(line, 0, 3)
    expect(task).toMatchObject({
      description: 'This task was cancelled',
      status: Status.Cancelled
    })
  })

  test('should parse a task with creation and completion dates', () => {
    const line = '- [x] Submit project plan cr:2025-07-28 cm:2025-07-30'
    const task = parser.parseTaskLine(line, 0, 4)
    expect(task).toMatchObject({
      description: 'Submit project plan',
      status: Status.Done,
      creationDate: '2025-07-28',
      completionDate: '2025-07-30'
    })
  })

  test('should parse a recurring task', () => {
    const line = '- [ ] Clean kitchen rec:w'
    const task = parser.parseTaskLine(line, 0, 5)
    expect(task).toMatchObject({
      description: 'Clean kitchen',
      status: Status.Todo,
      recurrence: 'w'
    })
  })

  test('should parse a task with custom key:value attributes', () => {
    const line = '- [ ] Read new book #personal-growth estimated:3h owner:John'
    const task = parser.parseTaskLine(line, 0, 6)
    expect(task).toMatchObject({
      description: 'Read new book',
      tags: ['personal-growth'],
      customAttributes: {
        estimated: '3h',
        owner: 'John'
      }
    })
  })

  test('should parse a complex task with multiple metadata', () => {
    const line =
      '- [ ] (A) +project-x @office Review the proposal due:2025-08-15 #review'
    const task = parser.parseTaskLine(line, 0, 16)
    expect(task).toMatchObject({
      priority: 'A',
      projects: ['project-x'],
      contexts: ['office'],
      description: 'Review the proposal',
      dueDate: '2025-08-15',
      tags: ['review'],
      status: Status.Todo
    })
  })

  test('should parse a task with subtasks (indentation)', () => {
    const content = `
- [ ] Main task
  - [ ] Subtask 1
    - [x] Subtask 2
`
    const tasks = parser.parse(content)
    expect(tasks).toHaveLength(3)
    expect(tasks[0]).toMatchObject({ description: 'Main task', level: 0 })
    expect(tasks[1]).toMatchObject({ description: 'Subtask 1', level: 1 })
    expect(tasks[2]).toMatchObject({
      description: 'Subtask 2',
      level: 2,
      status: Status.Done
    })
  })

  describe('serialize', () => {
    test('should serialize a simple task', () => {
      const simpleTaskContent = '- [x] Finish report'
      const parser = new TodoParser()
      const tasks = parser.parse(simpleTaskContent)
      
      const result = parser.serialize(tasks)
      expect(result.trim()).toBe(simpleTaskContent)
    })

    test('should serialize a complex task with all metadata', () => {
      const complexTaskContent = '- [~] (A) Review the proposal +project-x @office #review cr:2025-07-28 due:2025-08-15 rec:2w estimated:4h'
      const parser = new TodoParser()
      const tasks = parser.parse(complexTaskContent)

      const result = parser.serialize(tasks)
      expect(result).toContain('- [~] (A) Review the proposal')
      expect(result).toContain('+project-x')
      expect(result).toContain('@office')
      expect(result).toContain('#review')
      expect(result).toContain('cr:2025-07-28')
      expect(result).toContain('due:2025-08-15')
      expect(result).toContain('rec:2w')
      expect(result).toContain('estimated:4h')
    })

    test('should serialize tasks with hierarchy (indentation)', () => {
      const hierarchicalContent = '- [ ] Main task\n  - [ ] Subtask'
      const parser = new TodoParser()
      const tasks = parser.parse(hierarchicalContent)

      const result = parser.serialize(tasks)
      expect(result).toContain('- [ ] Main task')
      expect(result).toContain('  - [ ] Subtask')
    })
  })
})
