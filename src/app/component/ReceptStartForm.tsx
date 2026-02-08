"use client";
import React from "react";

interface ReceptStartFormProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onSubmit: () => void;
  submitLabel: string;
  themeColor?: "emerald" | "blue" | "cyan" | "amber" | "slate";
}

const ReceptStartForm = ({
  title,
  description,
  icon,
  children,
  onSubmit,
  submitLabel,
  themeColor = "emerald",
}: ReceptStartFormProps) => {
  const colorConfig = {
    emerald: {
      iconBg: "bg-emerald-100",
      iconText: "text-emerald-600",
      btnBg: "bg-emerald-600",
      btnHover: "hover:bg-emerald-700",
      btnShadow: "shadow-emerald-100",
    },
    blue: {
      iconBg: "bg-blue-100",
      iconText: "text-blue-600",
      btnBg: "bg-blue-600",
      btnHover: "hover:bg-blue-700",
      btnShadow: "shadow-blue-100",
    },
    cyan: {
      iconBg: "bg-cyan-100",
      iconText: "text-cyan-600",
      btnBg: "bg-cyan-600",
      btnHover: "hover:bg-cyan-700",
      btnShadow: "shadow-cyan-100",
    },
    amber: {
      iconBg: "bg-amber-100",
      iconText: "text-amber-600",
      btnBg: "bg-amber-600",
      btnHover: "hover:bg-amber-700",
      btnShadow: "shadow-amber-100",
    },
    slate: {
      iconBg: "bg-slate-100",
      iconText: "text-slate-600",
      btnBg: "bg-slate-800",
      btnHover: "hover:bg-slate-900",
      btnShadow: "shadow-slate-100",
    },
  };

  const config = colorConfig[themeColor] || colorConfig.emerald;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className={`w-12 h-12 ${config.iconBg} rounded-xl flex items-center justify-center ${config.iconText}`}>
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="space-y-8">
        {children}
        <div className="flex justify-center border-t border-slate-100 pt-8 mt-2">
          <button
            type="button"
            onClick={onSubmit}
            className={`w-full sm:w-auto px-12 py-4 ${config.btnBg} text-white font-bold rounded-2xl shadow-xl ${config.btnShadow} ${config.btnHover} transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center justify-center gap-3 group`}
          >
            <span className="text-lg">{submitLabel}</span>
            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceptStartForm;
