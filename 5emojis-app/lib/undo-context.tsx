import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type UndoState = {
  canUndo: boolean;
  onUndo: (() => void) | null;
  setUndo: (handler: (() => void) | null) => void;
};

const UndoContext = createContext<UndoState>({
  canUndo: false,
  onUndo: null,
  setUndo: () => {},
});

export function UndoProvider({ children }: { children: ReactNode }) {
  const [onUndo, setOnUndo] = useState<(() => void) | null>(null);

  const setUndo = useCallback((handler: (() => void) | null) => {
    // Wrap in function to avoid React treating the handler as a state updater
    setOnUndo(() => handler);
  }, []);

  return (
    <UndoContext.Provider value={{ canUndo: !!onUndo, onUndo, setUndo }}>
      {children}
    </UndoContext.Provider>
  );
}

export function useUndo() {
  return useContext(UndoContext);
}
