"use client";
import { useState } from "react";
import BasicInfoForm from "../../component/BasicInfoForm";
import AppHeader from "../../component/AppHeader";
import PatientSearchDialog from "../../component/PatientSearchDialog";
import { supabase } from "../../supabaseClient";

export default function Home() {
  const [mode, setMode] = useState<"register" | "edit">("register");
  const [patientId, setPatientId] = useState("");
  const [editData, setEditData] = useState<any>(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [error, setError] = useState("");

  const handleFetchPatient = async (id?: string) => {
    const targetId = id || patientId;
    if (!targetId) return;

    const { data, error: fetchError } = await supabase
      .from("patient_basic")
      .select("*")
      .eq("id", targetId)
      .single();

    if (fetchError || !data) {
      setError("該当する患者が見つかりません");
      setEditData(null);
    } else {
      setEditData(data);
      setPatientId(data.id.toString());
      setError("");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <AppHeader />
      <main className="flex-1 w-full py-8 px-4">
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 w-fit mx-auto shadow-sm">
            <button
              onClick={() => {
                setMode("register");
                setEditData(null);
                setPatientId("");
                setError("");
              }}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                mode === "register" ? "bg-cyan-600 text-white shadow-md shadow-cyan-100" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              新規登録
            </button>
            <button
              onClick={() => setMode("edit")}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                mode === "edit" ? "bg-cyan-600 text-white shadow-md shadow-cyan-100" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              修正
            </button>
          </div>
        </div>

        {mode === "edit" && (
          <div className="max-w-4xl mx-auto mb-10 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              修正対象の患者を検索
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-bold text-slate-600 mb-2">患者ID</label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="IDを入力"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-cyan-500/20 outline-none bg-slate-50 font-bold"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleFetchPatient()}
                  className="flex-1 sm:flex-none bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 transition-all active:scale-95 shadow-lg shadow-slate-100"
                >
                  修正
                </button>
                <button
                  onClick={() => setShowSearchDialog(true)}
                  className="flex-1 sm:flex-none border border-slate-200 bg-white text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all active:scale-95"
                >
                  一覧から検索
                </button>
              </div>
            </div>
            {error && <p className="mt-3 text-red-500 text-sm font-bold">{error}</p>}
          </div>
        )}

        {/* 新規登録モード、または修正モードでデータが取得できている場合のみフォームを表示 */}
        { (mode === "register" || (mode === "edit" && editData)) && (
          <BasicInfoForm mode={mode} editData={editData} />
        )}

        <PatientSearchDialog
          isOpen={showSearchDialog}
          onClose={() => setShowSearchDialog(false)}
          onSelect={(p) => {
            handleFetchPatient(p.id.toString());
            setShowSearchDialog(false);
          }}
          themeColor="cyan"
        />
      </main>
    </div>
  );
}
