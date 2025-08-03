import { TodoParser } from '../src/lib/TodoParser';
import { Task } from '../src/types/Task';

describe('TodoParser', () => {
  const parser = new TodoParser();

  // Test for parsing a simple task
  test('should parse a simple incomplete task', () => {
    const line = '- [ ] Buy milk';
    const task = parser.parseTaskLine(line, 0, 0);
    expect(task).toEqual(expect.objectContaining({
      description: 'Buy milk',
      completed: false,
      level: 0,
    }));
  });

  // Test for parsing a completed task
  test('should parse a completed task', () => {
    const line = '- [x] Finish report';
    const task = parser.parseTaskLine(line, 0, 1);
    expect(task).toEqual(expect.objectContaining({
      description: 'Finish report',
      completed: true,
    }));
  });

  // Test for parsing a cancelled task
  test('should parse a cancelled task', () => {
    const line = '- [-] Cancel subscription';
    const task = parser.parseTaskLine(line, 0, 2);
    expect(task).toEqual(expect.objectContaining({
      description: 'Cancel subscription',
      cancelled: true,
    }));
  });

  // Test for parsing priority
  test('should parse priority', () => {
    const line = '- [ ] (A) Call the client';
    const task = parser.parseTaskLine(line, 0, 3);
    expect(task?.priority).toBe('A');
    expect(task?.description).toBe('Call the client');
  });

  // Test for parsing projects
  test('should parse a single project', () => {
    const line = '- [ ] Work on the +my-project feature';
    const task = parser.parseTaskLine(line, 0, 4);
    expect(task?.projects).toEqual(['my-project']);
    expect(task?.description).toBe('Work on the feature');
  });

  test('should parse multiple projects', () => {
    const line = '- [ ] +project1 +project2 design the new UI';
    const task = parser.parseTaskLine(line, 0, 5);
    expect(task?.projects).toEqual(['project1', 'project2']);
    expect(task?.description).toBe('design the new UI');
  });

  // Test for parsing contexts
  test('should parse a single context', () => {
    const line = '- [ ] Buy groceries @store';
    const task = parser.parseTaskLine(line, 0, 6);
    expect(task?.contexts).toEqual(['store']);
    expect(task?.description).toBe('Buy groceries');
  });

  test('should parse multiple contexts', () => {
    const line = '- [ ] @work @urgent reply to the email';
    const task = parser.parseTaskLine(line, 0, 7);
    expect(task?.contexts).toEqual(['work', 'urgent']);
    expect(task?.description).toBe('reply to the email');
  });

  // Test for due date
  test('should parse due date', () => {
    const line = '- [ ] Submit report due:2025-12-31';
    const task = parser.parseTaskLine(line, 0, 8);
    expect(task?.dueDate).toBe('2025-12-31');
    expect(task?.description).toBe('Submit report');
  });

  // Test for creation date
  test('should parse creation date', () => {
    const line = '- [ ] New task cr:2025-08-01';
    const task = parser.parseTaskLine(line, 0, 9);
    expect(task?.creationDate).toBe('2025-08-01');
    expect(task?.description).toBe('New task');
  });

  // Test for completion date
  test('should parse completion date', () => {
    const line = '- [x] Old task cm:2025-07-30';
    const task = parser.parseTaskLine(line, 0, 10);
    expect(task?.completionDate).toBe('2025-07-30');
    expect(task?.description).toBe('Old task');
  });

  // Test for recurrence
  test('should parse recurrence', () => {
    const line = '- [ ] Clean the house rec:w';
    const task = parser.parseTaskLine(line, 0, 11);
    expect(task?.recurrence).toBe('w');
    expect(task?.description).toBe('Clean the house');
  });

  // Test for custom key-value pairs
  test('should parse custom key-value attributes', () => {
    const line = '- [ ] Read a book estimated:2h author:JohnDoe';
    const task = parser.parseTaskLine(line, 0, 12);
    expect(task?.customAttributes).toEqual({
      estimated: '2h',
      author: 'JohnDoe',
    });
    expect(task?.description).toBe('Read a book');
  });

  // Test for tags
  test('should parse tags', () => {
    const line = '- [ ] #learning #reading research a new topic';
    const task = parser.parseTaskLine(line, 0, 13);
    expect(task?.tags).toEqual(['learning', 'reading']);
    expect(task?.description).toBe('research a new topic');
  });

  // Test for combining multiple metadata
  test('should parse a complex task with multiple metadata', () => {
    const line = '- [ ] (A) +project-x @office Review the proposal due:2025-08-15 #review';
    const task = parser.parseTaskLine(line, 0, 16);
    expect(task).toMatchObject({
      priority: 'A',
      projects: ['project-x'],
      contexts: ['office'],
      dueDate: '2025-08-15',
      tags: ['review'],
      description: 'Review the proposal',
      completed: false,
      level: 0,
    });
  });

  // Test serialize function
  describe('serialize', () => {
    test('should serialize a simple task', () => {
      const tasks: Task[] = [{
        id: 0,
        description: 'Buy milk',
        completed: false,
        level: 0,
      }];
      const expected = '# To-Do List\n\n## Tasks\n\n- [ ] Buy milk';
      expect(parser.serialize(tasks).replace(/\n/g, '')).toBe(expected.replace(/\n/g, ''));
    });

    test('should serialize a completed task', () => {
      const tasks: Task[] = [{
        id: 1,
        description: 'Finish report',
        completed: true,
        level: 0,
      }];
      const expected = '# To-Do List\n\n## Tasks\n\n- [x] Finish report';
      expect(parser.serialize(tasks).replace(/\n/g, '')).toBe(expected.replace(/\n/g, ''));
    });

    test('should serialize a task with all metadata', () => {
      const tasks: Task[] = [{
        id: 16,
        description: 'Review the proposal',
        completed: false,
        level: 0,
        priority: 'A',
        projects: ['project-x'],
        contexts: ['office'],
        dueDate: '2025-08-15',
        tags: ['review'],
        customAttributes: { owner: 'me' },
      }];
      const expected = '# To-Do List\n\n## Tasks\n\n- [ ] (A) Review the proposal +project-x @office #review due:2025-08-15 owner:me';
      expect(parser.serialize(tasks).replace(/\n/g, '')).toContain(expected.replace('# To-Do List\n\n## Tasks\n\n', ''));
    });
  });
});