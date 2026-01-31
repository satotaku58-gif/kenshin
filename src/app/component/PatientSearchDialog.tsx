"use client";

import { useState } from "react";
import { supabase } from "../supabaseClient";

interface Patient {
  id: number;
  name: string;
  birthdate: string;
  sex: number | string;
}

interface PatientSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (patient: Patient) => void;
  themeColor?: "blue" | "emerald" | "cyan";
}

export default function PatientSearchDialog({
  isOpen,
  onClose,
  onSelect,
  themeColor = "blue",
}: PatientSearchDialogProps) {
  const [patientList, setPatientList] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  // 性別ラベル取得
  const getGenderLabel = (gender: string | number | undefined): string => {
    if (gender === "1" || gender === 1) return "男性";
    if (gender === "2" || gender === 2) return "女性";
    if (gender === "9" || gender === 9) return "その他";
    return "-";
  };

  // データ取得 (ダイアログが開いたときに呼び出すなどの制御は親で行うことも可能だが、
  // ここではシンプルにするため、useEffectではなくメソッドを公開するか、
  // 常に最新を出すためにisOpen時にfetchする)
  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("patient_basic")
      .select("id, name, birthdate, sex")
      .order("id", { ascending: true });
    if (!error && data) {
      setPatientList(data);
    } else {
      setPatientList([]);
    }
    setLoading(false);
  };

  // ダイアログが表示された瞬間にデータを取得する
  if (isOpen && patientList.length === 0 && !loading) {
    fetchPatients();
  }

  if (!isOpen) return null;

  const bgColor = themeColor === "cyan" ? "bg-cyan-600" : themeColor === "emerald" ? "bg-emerald-600" : "bg-blue-600";
  const textColor = themeColor === "cyan" ? "text-cyan-600" : themeColor === "emerald" ? "text-emerald-600" : "text-blue-600";
  const hoverColor = themeColor === "cyan" ? "hover:bg-cyan-700" : themeColor === "emerald" ? "hover:bg-emerald-700" : "hover:bg-blue-700";
  const spinnerBorder = themeColor === "cyan" ? "border-t-cyan-600" : themeColor === "emerald" ? "border-t-emerald-600" : "border-t-blue-600";
  const monoColor = themeColor === "cyan" ? "text-cyan-600" : themeColor === "emerald" ? "text-emerald-600" : "text-blue-600";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center text-white`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800">患者検索結果</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex flex-col items-center py-12 text-slate-400">
              <div className={`w-10 h-10 border-4 border-slate-100 ${spinnerBorder} rounded-full animate-spin mb-4`}></div>
              <p>データを読み込み中...</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-slate-100 rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse sticky-header">
                  <thead className="sticky top-0 z-10 bg-slate-50 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                    <tr className="text-slate-600 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">氏名</th>
                      <th className="px-6 py-4">生年月日</th>
                      <th className="px-6 py-4">性別</th>
                      <th className="px-6 py-4 text-right">アクション</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patientList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">患者データが見つかりませんでした</td>
                      </tr>
                    ) : (
                      patientList.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className={`px-6 py-4 font-mono ${monoColor} font-bold`}>{p.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{p.name}</td>
                          <td className="px-6 py-4 text-slate-500">{p.birthdate}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              p.sex === 1 || p.sex === "1" ? "bg-blue-100 text-blue-700" : p.sex === 2 || p.sex === "2" ? "bg-pink-100 text-pink-700" : "bg-slate-100 text-slate-700"
                            }`}>
                              {getGenderLabel(p.sex)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              className={`${bgColor} text-white px-4 py-1.5 rounded-lg font-bold text-sm ${hoverColor} transition-colors shadow-sm`}
                              onClick={() => onSelect(p)}
                            >
                              選択
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
