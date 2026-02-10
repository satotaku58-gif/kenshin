"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface QuestionnaireState {
  patientId: string;
  patientName: string;
  receptionDate: string;
  receptionId: string;
  receptInternalId: number | null;
  answers: string[];
  showForm: boolean;
}

interface QuestionnaireContextType extends QuestionnaireState {
  setPatientId: (val: string) => void;
  setPatientName: (val: string) => void;
  setReceptionDate: (val: string) => void;
  setReceptionId: (val: string) => void;
  setReceptInternalId: (val: number | null) => void;
  setAnswers: (val: string[] | ((prev: string[]) => string[])) => void;
  setShowForm: (val: boolean) => void;
  resetState: () => void;
  isLoaded: boolean;
}

const initialState: QuestionnaireState = {
  patientId: "",
  patientName: "",
  receptionDate: new Date().toISOString().split('T')[0],
  receptionId: "",
  receptInternalId: null,
  answers: [],
  showForm: false,
};

const QuestionnaireContext = createContext<QuestionnaireContextType | undefined>(undefined);

export function QuestionnaireProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QuestionnaireState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("questionnaire_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed);
      } catch (e) {
        console.error("Failed to parse saved questionnaire state", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to sessionStorage when state changes
  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem("questionnaire_state", JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const setPatientId = (patientId: string) => setState(prev => ({ ...prev, patientId }));
  const setPatientName = (patientName: string) => setState(prev => ({ ...prev, patientName }));
  const setReceptionDate = (receptionDate: string) => setState(prev => ({ ...prev, receptionDate }));
  const setReceptionId = (receptionId: string) => setState(prev => ({ ...prev, receptionId }));
  const setReceptInternalId = (receptInternalId: number | null) => setState(prev => ({ ...prev, receptInternalId }));
  const setAnswers = (val: string[] | ((prev: string[]) => string[])) => 
    setState(prev => ({ 
      ...prev, 
      answers: typeof val === 'function' ? val(prev.answers) : val 
    }));
  const setShowForm = (showForm: boolean) => setState(prev => ({ ...prev, showForm }));

  const resetState = () => {
    setState(initialState);
    sessionStorage.removeItem("questionnaire_state");
  };

  return (
    <QuestionnaireContext.Provider
      value={{
        ...state,
        setPatientId,
        setPatientName,
        setReceptionDate,
        setReceptionId,
        setReceptInternalId,
        setAnswers,
        setShowForm,
        resetState,
        isLoaded,
      }}
    >
      {children}
    </QuestionnaireContext.Provider>
  );
}

export function useQuestionnaire() {
  const context = useContext(QuestionnaireContext);
  if (context === undefined) {
    throw new Error("useQuestionnaire must be used within a QuestionnaireProvider");
  }
  return context;
}
