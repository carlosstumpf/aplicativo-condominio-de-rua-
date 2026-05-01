import React, { createContext, useContext, useState, ReactNode } from "react";

interface CondominioContextType {
  currentMes: string;
  setCurrentMes: (mes: string) => void;
}

const CondominioContext = createContext<CondominioContextType | undefined>(undefined);

export function CondominioProvider({ children }: { children: ReactNode }) {
  const [currentMes, setCurrentMes] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  return (
    <CondominioContext.Provider value={{ currentMes, setCurrentMes }}>
      {children}
    </CondominioContext.Provider>
  );
}

export function useCondominio() {
  const context = useContext(CondominioContext);
  if (!context) {
    throw new Error("useCondominio must be used within CondominioProvider");
  }
  return context;
}
