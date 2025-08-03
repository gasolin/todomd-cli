export interface Task {
  id?: number;
  description: string;
  completed: boolean;
  cancelled?: boolean;
  priority?: string;
  projects?: string[];
  contexts?: string[];
  creationDate?: string;
  completionDate?: string;
  dueDate?: string;
  recurrence?: string;
  customAttributes?: Record<string, string>;
  tags?: string[];
  level: number; // indentation level for subtasks
  parent?: number; // parent task ID for hierarchical structure
  children?: number[]; // child task IDs
  rawLine?: string; // original line from markdown
}
