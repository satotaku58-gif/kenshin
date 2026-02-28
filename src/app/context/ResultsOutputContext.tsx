"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ResultsOutputState {
  patientId: string;
  patientName: string;
  patientBirth: string;
  patientGender: string;
  receptionDate: string;
  receptionId: string;
  showResults: boolean;
  historyData: any[];
  itemMasters: any[];
  findings: string;
  judge: string;
}

interface ResultsOutputContextType extends ResultsOutputState {
  setPatientId: (val: string) => void;
  setPatientName: (val: string) => void;
  setPatientBirth: (val: string) => void;
  setPatientGender: (val: string) => void;
  setReceptionDate: (val: string) => void;
  setReceptionId: (val: string) => void;
  setShowResults: (val: boolean) => void;
  setHistoryData: (val: any[]) => void;
  setItemMasters: (val: any[]) => void;
  setFindings: (val: string) => void;
  setJudge: (val: string) => void;
  resetState: () => void;
  isLoaded: boolean;
}

const initialState: ResultsOutputState = {
  patientId: "",
  patientName: "",
  patientBirth: "",
  patientGender: "",
  receptionDate: new Date().toISOString().split('T')[0],
  receptionId: "",
  showResults: false,
  historyData: [],
  itemMasters: [],
  findings: "",
  judge: "判定しない",
};

const ResultsOutputContext = createContext<ResultsOutputContextType | undefined>(undefined);

export function ResultsOutputProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ResultsOutputState>(initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem("results_output_state");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(parsed);
      } catch (e) {
        console.error("Failed to parse saved results output state", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to sessionStorage when state changes
  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem("results_output_state", JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const setPatientId = (patientId: string) => setState(prev => ({ ...prev, patientId }));
  const setPatientName = (patientName: string) => setState(prev => ({ ...prev, patientName }));
  const setPatientBirth = (patientBirth: string) => setState(prev => ({ ...prev, patientBirth }));
  const setPatientGender = (patientGender: string) => setState(prev => ({ ...prev, patientGender }));
  const setReceptionDate = (receptionDate: string) => setState(prev => ({ ...prev, receptionDate }));
  const setReceptionId = (receptionId: string) => setState(prev => ({ ...prev, receptionId }));
  const setShowResults = (showResults: boolean) => setState(prev => ({ ...prev, showResults }));
  const setHistoryData = (historyData: any[]) => setState(prev => ({ ...prev, historyData }));
  const setItemMasters = (itemMasters: any[]) => setState(prev => ({ ...prev, itemMasters }));
  const setFindings = (findings: string) => setState(prev => ({ ...prev, findings }));
  const setJudge = (judge: string) => setState(prev => ({ ...prev, judge }));

  const resetState = () => {
    setState(initialState);
    sessionStorage.removeItem("results_output_state");
  };

  return (
    <ResultsOutputContext.Provider
      value={{
        ...state,
        setPatientId,
        setPatientName,
        setPatientBirth,
        setPatientGender,
        setReceptionDate,
        setReceptionId,
        setShowResults,
        setHistoryData,
        setItemMasters,
        setFindings,
        setJudge,
        resetState,
        isLoaded,
      }}
    >
      {children}
    </ResultsOutputContext.Provider>
  );
}

export function useResultsOutput() {
  const context = useContext(ResultsOutputContext);
  if (context === undefined) {
    throw new Error("useResultsOutput must be used within a ResultsOutputProvider");
  }
  return context;
}
