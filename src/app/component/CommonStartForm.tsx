"use client";
import React from "react";
import ReceptStartForm from "./ReceptStartForm";

interface CommonStartFormProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onSubmit: () => void;
  submitLabel: string;
  themeColor: "emerald" | "blue" | "cyan" | "amber" | "yellow" | "slate";
  patientId: string;
  setPatientId: (val: string) => void;
  receptionDate: string;
  setReceptionDate: (val: string) => void;
  receptionId: string;
  setReceptionId: (val: string) => void;
  errors: { [key: string]: string };
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onPatientSearchClick: () => void;
  onReceptSearchClick: () => void;
}

const CommonStartForm = (props: CommonStartFormProps) => {
  const {
    title,
    description,
    icon,
    onSubmit,
    submitLabel,
    themeColor,
    patientId,
    setPatientId,
    receptionDate,
    setReceptionDate,
    receptionId,
    setReceptionId,
    errors,
    setErrors,
    onPatientSearchClick,
    onReceptSearchClick,
  } = props;

  const ringColor = {
    emerald: "focus:ring-emerald-500/20 focus:border-emerald-500",
    amber: "focus:ring-amber-500/20 focus:border-amber-500",
    yellow: "focus:ring-yellow-500/20 focus:border-yellow-500",
    blue: "focus:ring-blue-500/20 focus:border-blue-500",
    cyan: "focus:ring-cyan-500/20 focus:border-cyan-500",
    slate: "focus:ring-slate-500/20 focus:border-slate-500",
  }[themeColor] || "focus:ring-emerald-500/20 focus:border-emerald-500";

  return (
    <ReceptStartForm
      title={title}
      description={description}
      icon={icon}
      onSubmit={onSubmit}
      submitLabel={submitLabel}
      themeColor={themeColor}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
        <div className="relative">
          <label className="block text-sm font-bold text-slate-600 mb-2">患者ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="例: 1001"
              className={`flex-1 px-4 py-3 bg-slate-50/50 border ${
                errors.patientId ? "border-red-500 bg-red-50/50" : "border-slate-200"
              } rounded-xl ${ringColor} transition-all outline-none font-bold text-slate-700`}
              value={patientId}
              onChange={(e) => {
                setPatientId(e.target.value);
                if (errors.patientId) setErrors((prev) => ({ ...prev, patientId: "" }));
              }}
            />
            <button
              type="button"
              onClick={onPatientSearchClick}
              className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center shrink-0 group"
              title="患者IDを検索"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          {errors.patientId && (
            <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.patientId}
              <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
            </div>
          )}
        </div>
        <div className="relative">
          <label className="block text-sm font-bold text-slate-600 mb-2">受診日</label>
          <input
            type="date"
            className={`w-full px-4 py-3 bg-slate-50/50 border ${
              errors.receptionDate ? "border-red-500 bg-red-50/50" : "border-slate-200"
            } rounded-xl ${ringColor} transition-all outline-none font-bold text-slate-700`}
            value={receptionDate}
            onChange={(e) => {
              setReceptionDate(e.target.value);
              if (errors.receptionDate) setErrors((prev) => ({ ...prev, receptionDate: "" }));
            }}
          />
          {errors.receptionDate && (
            <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.receptionDate}
              <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
            </div>
          )}
        </div>
        <div className="relative">
          <label className="block text-sm font-bold text-slate-600 mb-2">受付ID</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="例: 5001"
              className={`flex-1 px-4 py-3 bg-slate-50/50 border ${
                errors.receptionId ? "border-red-500 bg-red-50/50" : "border-slate-200"
              } rounded-xl ${ringColor} transition-all outline-none font-bold text-slate-700`}
              value={receptionId}
              onChange={(e) => {
                setReceptionId(e.target.value);
                if (errors.receptionId) setErrors((prev) => ({ ...prev, receptionId: "" }));
              }}
            />
            <button
              type="button"
              onClick={onReceptSearchClick}
              className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center shrink-0 group"
              title="受付IDを検索"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
          {errors.receptionId && (
            <div className="absolute top-full left-0 mt-2 z-10 bg-white border border-red-200 text-red-600 text-[12px] font-bold px-3 py-1.5 rounded-xl shadow-xl shadow-red-100/50 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.receptionId}
              <div className="absolute -top-1 left-4 w-2 h-2 bg-white border-t border-l border-red-200 rotate-45"></div>
            </div>
          )}
        </div>
      </div>
    </ReceptStartForm>
  );
};

export default CommonStartForm;
