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

  describe('serialize', () => {
    test('should serialize a completed task', () => {
      const tasks: Task[] = [
        {
          id: 1,
          description: 'Finish report',
          status: Status.Done,
          level: 0,
          projects: [],
          contexts: [],
          tags: [],
          customAttributes: {}
        }
      ]
      const expected = '# To-Do List\n\n## Tasks\n\n- [x] Finish report'
      // Using trim() to avoid issues with trailing newlines
      expect(parser.serialize(tasks).trim()).toBe(expected.trim())
    })
  })
})
