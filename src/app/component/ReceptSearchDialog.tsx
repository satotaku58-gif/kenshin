"use client";

import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

interface Reception {
  id: number;
  recept_id: number;
  recept_date: string;
  course: string;
}

interface ReceptSearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (reception: Reception) => void;
  patientId: string;
}

export default function ReceptSearchDialog({
  isOpen,
  onClose,
  onSelect,
  patientId,
}: ReceptSearchDialogProps) {
  const [receptList, setReceptList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchCourses = async () => {
      const { data } = await supabase.from("kensa_course").select("id, name");
      if (data) {
        const courseMap = data.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.name }), {});
        setCourses(courseMap);
      }
    };
    fetchCourses();
  }, []);

  const fetchReceptions = async () => {
    if (!patientId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("recept")
      .select("id, recept_id, recept_date, course")
      .eq("patient_id", patientId)
      .order("recept_date", { ascending: true })
      .order("recept_id", { ascending: true });
    
    if (!error && data) {
      setReceptList(data);
    } else {
      setReceptList([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchReceptions();
    }
  }, [isOpen, patientId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800">受付履歴から選択</h3>
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
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center py-12 text-slate-400">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
              <p>データを読み込み中...</p>
            </div>
          ) : (
            <div className="overflow-hidden border border-slate-100 rounded-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">受付ID</th>
                      <th className="px-6 py-4">受診日</th>
                      <th className="px-6 py-4">コース</th>
                      <th className="px-6 py-4 text-right">アクション</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {receptList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">受付データが見つかりませんでした</td>
                      </tr>
                    ) : (
                      receptList.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-mono text-emerald-600 font-bold">{r.recept_id}</td>
                          <td className="px-6 py-4 text-slate-700 font-medium">{r.recept_date}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                              {courses[r.course] || r.course || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-emerald-700 transition-colors shadow-sm"
                              onClick={() => onSelect(r)}
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
