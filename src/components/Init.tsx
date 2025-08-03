import React, { useEffect } from 'react';
import fs from 'fs/promises';
import path from 'path';

interface InitProps {
  todoDir: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  ink: any;
}

const Init: React.FC<InitProps> = ({ todoDir, onSuccess, onError, ink }) => {
  const { Box, Text } = ink;

  useEffect(() => {
    const initializeDirectory = async () => {
      try {
        // Create directory if it doesn't exist
        await fs.mkdir(todoDir, { recursive: true });

        // Create todo.md
        const todoPath = path.join(todoDir, 'todo.md');
        const todoContent = `# To-Do List

## Today's Priorities

- [ ] Example task with priority (A) @home +personal due:2025-08-10
  - [ ] This is a subtask
  - [ ] Another subtask

## Project Tasks

- [ ] (B) Review project proposal @work +project-x
- [ ] Schedule team meeting @office rec:w

---

## Completed Tasks

- [x] Setup todomd directory cm:${new Date().toISOString().split('T')[0]}
`;

        await fs.writeFile(todoPath, todoContent, 'utf8');

        // Create done.md
        const donePath = path.join(todoDir, 'done.md');
        const doneContent = `# Completed Tasks

This file contains archived completed tasks.

---

<!-- Completed tasks will be moved here when archived -->
`;

        await fs.writeFile(donePath, doneContent, 'utf8');

        // Create .env example
        const envPath = path.join(todoDir, '.env.example');
        const envContent = `# TodoMD Configuration
TODO_DIR=${todoDir}

# Optional: Custom file names
# TODO_FILE=todo.md
# DONE_FILE=done.md
`;

        await fs.writeFile(envPath, envContent, 'utf8');

        onSuccess();
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to initialize directory');
      }
    };

    initializeDirectory();
  }, [todoDir, onSuccess, onError]);

  return (
    <Box flexDirection="column">
      <Text bold color="blue">Initializing TodoMD Directory</Text>
      <Text>Directory: {todoDir}</Text>
      <Box marginTop={1}>
        <Text color="gray">Creating files:</Text>
      </Box>
      <Text color="green">• todo.md (main task file)</Text>
      <Text color="green">• done.md (completed tasks archive)</Text>
      <Text color="green">• .env.example (configuration example)</Text>
      <Box marginTop={1}>
        <Text color="yellow">
          Add "export TODO_DIR={todoDir}" to your shell profile (~/.bashrc, ~/.zshrc)
        </Text>
      </Box>
    </Box>
  );
};

export default Init;