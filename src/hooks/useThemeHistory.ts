import { useState, useCallback } from 'react';
import { Theme } from '@/lib/types/theme';

/**
 * Hook to manage theme history for undo/redo functionality
 * Maintains a stack of theme states (last 50 changes)
 */
export const useThemeHistory = (initialTheme: Theme) => {
  const [history, setHistory] = useState<Theme[]>([initialTheme]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const push = useCallback((theme: Theme) => {
    setHistory((prev) => {
      // Remove future states if we're not at the end
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(theme);

      // Limit to last 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        setCurrentIndex((idx) => idx); // Don't increment if we removed first item
      } else {
        setCurrentIndex((idx) => idx + 1);
      }

      return newHistory;
    });
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex((prev) => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [canUndo, history, currentIndex]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex((prev) => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [canRedo, history, currentIndex]);

  const reset = useCallback((theme: Theme) => {
    setHistory([theme]);
    setCurrentIndex(0);
  }, []);

  return {
    currentTheme: history[currentIndex],
    canUndo,
    canRedo,
    undo,
    redo,
    push,
    reset,
  };
};
