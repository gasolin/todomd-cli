import React, { useState, useEffect } from 'react';
import { Commander } from '../lib/Commander.js';
import { Task } from '../types/Task.js';
import { TodoParser } from '../lib/TodoParser.js';

interface AppProps {
  command: string;
  args: string[];
  flags: any;
  todoDir: string;
}

type Status = 'loading' | 'success' | 'error';

const App: React.FC<AppProps> = ({ command, args, flags, todoDir }) => {
  const [status, setStatus] = useState<Status>('loading');
  const [output, setOutput] = useState<string | Task[] | null>(null);
  const [Ink, setInk] = useState<any>(null);
  const [parser] = useState(() => new TodoParser());

  useEffect(() => {
    const loadInk = async () => {
      const ink = await import('ink');
      setInk(ink);
    };
    loadInk();
  }, []);

  useEffect(() => {
    if (!Ink) return;

    const run = async () => {
      try {
        const commander = new Commander(todoDir, flags.file, flags.doneFile);
        const result = await commander.run(command, args);
        setOutput(result);
        setStatus('success');
      } catch (err) {
        setOutput(err instanceof Error ? err.message : 'An unknown error occurred');
        setStatus('error');
      }
    };

    run();
  }, [Ink, command, args, flags, todoDir]);

  if (status === 'loading' || !Ink) {
    return null;
  }

  const { Text, Box } = Ink;

  // Handle string output for messages
  if (typeof output === 'string') {
    const color = status === 'error' ? 'red' : 'green';
    return <Text color={color}>{output}</Text>;
  }

  // Handle Task[] output for lists
  if (Array.isArray(output)) {
    if (output.length === 0) {
      return <Text>No tasks found.</Text>;
    }
    
    const maxDigits = String(output.length).length;

    return (
      <Box flexDirection="column">
        {
          output.map((task, index) => {
            let statusSymbol = '  '; // Default to two spaces for alignment
            if (task.completed) {
              statusSymbol = '✓ ';
            } else if (task.cancelled) {
              statusSymbol = '✗ ';
            }

            const serializedTask = parser.serialize([task]);
            // Remove the markdown list prefix, status, and the header
            const taskDescription = serializedTask.replace(/# To-Do List\n\n## Tasks\n\n- \[[ x-]\] /, '');
            
            const taskNumber = String(index + 1).padStart(maxDigits, ' ');
            const numberedTaskLine = `${taskNumber}. ${statusSymbol}${taskDescription}`;
            
            const color = task.completed || task.cancelled ? 'gray' : undefined;

            return (
              <Text key={index} color={color}>
                {numberedTaskLine}
              </Text>
            );
          })
        }
      </Box>
    );
  }

  return <Text color="red">Invalid output type.</Text>;
};

export default App;
