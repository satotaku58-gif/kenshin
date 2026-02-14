"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ResultsInputState {
  patientId: string;
  patientName: string;
  receptionDate: string;
  receptionId: string;
  receptPk: number | null;
  examinationItems: any[];
  showForm: boolean;
}

interface ResultsInputContextType extends ResultsInputState {
  setPatientId: (val: string) => void;
  setPatientName: (val: string) => void;
  setReceptionDate: (val: string) => void;
  setReceptionId: (val: string) => void;
  setReceptPk: (val: number | null) => void;
  setExaminationItems: (val: any[] | ((prev: any[]) => string[])) => void;
  setShowForm: (val: boolean) => void;
  resetState: () => void;
  isLoaded: boolean;
}

const initialState: ResultsInputState = {
  patientId: "",
  patientName: "",
  receptionDate: new Date().toISOString().split('T')[0],
  receptionId: "",
  receptPk: null,
  examinationItems: [],
  showForm: false,
};

const ResultsInputContext = createContext<ResultsInputContextType | undefined>(undefined);

export function ResultsInputProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ResultsInputState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("results_input_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed);
      } catch (e) {
        console.error("Failed to parse saved results input state", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to sessionStorage when state changes
  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem("results_input_state", JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const setPatientId = (patientId: string) => setState(prev => ({ ...prev, patientId }));
  const setPatientName = (patientName: string) => setState(prev => ({ ...prev, patientName }));
  const setReceptionDate = (receptionDate: string) => setState(prev => ({ ...prev, receptionDate }));
  const setReceptionId = (receptionId: string) => setState(prev => ({ ...prev, receptionId }));
  const setReceptPk = (receptPk: number | null) => setState(prev => ({ ...prev, receptPk }));
  const setExaminationItems = (val: any[] | ((prev: any[]) => any[])) => 
    setState(prev => ({ 
      ...prev, 
      examinationItems: typeof val === 'function' ? val(prev.examinationItems) : val 
    }));
  const setShowForm = (showForm: boolean) => setState(prev => ({ ...prev, showForm }));

  const resetState = () => {
    setState(initialState);
    sessionStorage.removeItem("results_input_state");
  };

  return (
    <ResultsInputContext.Provider
      value={{
        ...state,
        setPatientId,
        setPatientName,
        setReceptionDate,
        setReceptionId,
        setReceptPk,
        setExaminationItems,
        setShowForm,
        resetState,
        isLoaded,
      }}
    >
      {children}
    </ResultsInputContext.Provider>
  );
}

export function useResultsInput() {
  const context = useContext(ResultsInputContext);
  if (context === undefined) {
    throw new Error("useResultsInput must be used within a ResultsInputProvider");
  }
  return context;
}
