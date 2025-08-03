import React, { useState, useEffect } from 'react';
import { Commander } from '../lib/Commander.js';

interface AppProps {
  command: string;
  args: string[];
  flags: any;
  todoDir: string;
}

type Status = 'loading' | 'success' | 'error';

const App: React.FC<AppProps> = ({ command, args, flags, todoDir }) => {
  const [status, setStatus] = useState<Status>('loading');
  const [output, setOutput] = useState<string>('');
  const [Ink, setInk] = useState<any>(null);

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
  const isListCommand = command === 'list' || command === 'ls';
  const successColor = isListCommand ? undefined : 'green'; // Use default color for list command

  return (
    <Box flexDirection="column" paddingY={1}>
      {status === 'error'
        ? <Text color="red">{output}</Text>
        : output.split('\n').map((line, i) => <Text key={i} color={successColor}>{line}</Text>)
      }
    </Box>
  );
};

export default App;