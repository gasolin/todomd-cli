import React, { useState, useEffect } from 'react';
import App from './App.js';

interface AppLoaderProps {
  command: string;
  args: string[];
  flags: any;
  todoDir: string;
}

const AppLoader: React.FC<AppLoaderProps> = (props) => {
  const [inkComponents, setInkComponents] = useState<any>(null);

  useEffect(() => {
    const loadInk = async () => {
      const { Box, Text } = await import('ink');
      setInkComponents({ Box, Text });
    };
    loadInk();
  }, []);

  if (!inkComponents) {
    return null; // Or a loading indicator
  }

  return <App {...props} ink={inkComponents} />;
};

export default AppLoader;