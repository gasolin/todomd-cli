# todomd-cli

A command-line tool for managing todomd format files, inspired by todo.txt-cli but designed specifically for the todomd specification that combines Markdown with todo.txt features.

## Features

- 📝 **Markdown Native**: Uses standard Markdown task list syntax
- 🏷️ **Rich Metadata**: Supports priorities, projects, contexts, due dates, and custom attributes
- 🌳 **Hierarchical Tasks**: Native support for subtasks through indentation
- 🤖 **LLM-Friendly**: Structured format optimized for AI parsing and automation
- 🔧 **Configurable**: Environment variable support for custom directories
- 🎨 **Beautiful CLI**: Built with Ink for a modern terminal experience

## Feature Status

- [x] `init` - Initialize the todo directory
- [x] `add, a <task>` - Add a new task
- [x] `list, ls` - List all tasks
- [x] `done, do <id>` - Mark a task as completed
- [x] `undone, ud <id>` - Mark task as incomplete
- [x] `delete, rm, del <id>` - Delete a task
- [ ] `edit <id>` - Edit a task interactively
- [x] `priority, pri <id> <priority>` - Set task priority
- [x] `project, proj <id> <project>` - Add a project to a task
- [x] `context, ctx <id> <context>` - Add a context to a task
- [x] `due <id> <date>` - Set a due date for a task
- [x] `search <term>` - Search for tasks
- [ ] `archive` - Move completed tasks to done.md

## Installation

```bash
npm install -g @gasolin/todomd-cli
```

Or clone and build locally:

```bash
git clone https://github.com/gasolin/todomd-cli.git
cd todomd-cli
npm install
npm run build
npm link
```

## Configuration

Set your todo directory using environment variables:

```bash
# In your shell profile (~/.bashrc, ~/.zshrc, etc.)
export TODO_DIR="$HOME/Documents/todos"

# Or create a .env file in your project directory
echo "TODO_DIR=/path/to/your/todos" > .env
```

## Quick Start

1. Initialize a new todomd directory:
```bash
todomd init
```

2. Add some tasks:
```bash
todomd add "Buy groceries @home +personal due:2025-08-10"
todomd add "(A) Important meeting preparation @office +work"
todomd add "Call dentist for appointment"
```

3. List your tasks:
```bash
todomd list
```

4. Mark tasks as complete:
```bash
todomd done 1
```

### Direct File/Directory Usage

You can also work with specific `todo.md` files directly by providing a path:

```bash
# List tasks from a specific file
todomd path/to/another/todo.md

# List tasks from todo.md in a specific directory
todomd path/to/a/project/
```

## Commands

### Basic Operations

- `todomd list, ls` - List all tasks
- `todomd add, a <task>` - Add a new task
- `todomd done, do <id>` - Mark task as completed
- `todomd undone, ud <id>` - Mark task as incomplete
- `todomd delete, rm, del <id>` - Delete a task

### Task Management

- `todomd edit <id>` - Edit a task interactively
- `todomd priority, pri <id> <priority>` - Set task priority (A-Z)
- `todomd project, proj <id> <project>` - Add project to task
- `todomd context, ctx <id> <context>` - Add context to task
- `todomd due <id> <date>` - Set due date (YYYY-MM-DD format)

### Search and Filter

- `todomd search <term>` - Search tasks by description

### Setup

- `todomd init` - Initialize todomd directory with sample files

## Task Syntax

TodoMD uses standard Markdown task lists with additional metadata:

```markdown
- [ ] (A) Task description @context +project due:2025-08-10 rec:w
  - [ ] Subtask 1
  - [ ] Subtask 2
- [x] Completed task cm:2025-08-01
- [-] Cancelled task
```

### Metadata Format

- **Priority**: `(A)` to `(Z)` - Higher priority tasks
- **Projects**: `+project-name` - Group related tasks
- **Contexts**: `@context-name` - Where/when to do tasks
- **Due Date**: `due:YYYY-MM-DD` - Task deadline
- **Creation Date**: `cr:YYYY-MM-DD` - When task was created
- **Completion Date**: `cm:YYYY-MM-DD` - When task was completed
- **Recurrence**: `rec:d/w/m/y` - Recurring tasks (daily/weekly/monthly/yearly)
- **Custom Attributes**: `key:value` - Any additional metadata
- **Tags**: `#tag-name` - Categorize tasks

## Examples

```bash
# Add a high-priority work task with due date
todomd add "(A) Prepare quarterly report @office +work due:2025-08-15"

# Add a recurring personal task
todomd add "Exercise for 30 minutes @gym +health rec:d"

# Add a task with subtasks (note: subtasks must be added manually to the file)
todomd add "Plan vacation +personal"
# Then edit todo.md to add:
#   - [ ] Plan vacation +personal
#     - [ ] Research destinations
#     - [ ] Book flights
#     - [ ] Reserve hotel

# Search for specific tasks
todomd search "report"

# Set priority for existing task
todomd priority 1 A

# Mark task as done
todomd done 1

# Add context to existing task
todomd context 2 home
```

## File Structure

When you run `todomd init`, it creates:

```
~/.todomd/          # Default directory (or your TODO_DIR)
├── todo.md         # Main task file
├── done.md         # Completed tasks archive
└── .env.example    # Configuration example
```

## Integration with Other Tools

Since TodoMD files are standard Markdown, they work with:

- Any Markdown editor (VS Code, Obsidian, Typora, etc.)
- Git for version control and collaboration
- Static site generators for publishing
- LLMs and AI tools for intelligent task management
- CI/CD pipelines for automated task processing

## Development

```bash
# Clone the repository
git clone https://github.com/gasolin/todomd-cli.git
cd todomd-cli

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Link for global usage
npm link
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT License - see LICENSE file for details.

## Related Projects

- [todomd specification](https://github.com/gasolin/todomd) - The specification this tool implements
- [todo.txt](https://github.com/todotxt/todo.txt) - The inspiration for the metadata format
- [GitHub Flavored Markdown](https://github.github.com/gfm/) - The base Markdown specification