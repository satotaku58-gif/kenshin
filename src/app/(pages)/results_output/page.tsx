"use client";

import AppHeader from "../../component/AppHeader";
import PatientSearchDialog from "../../component/PatientSearchDialog";
import ReceptSearchDialog from "../../component/ReceptSearchDialog";
import ReceptStartForm from "../../component/ReceptStartForm";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../supabaseClient";

function ResultsOutputContent() {
  const searchParams = useSearchParams();

  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [receptionDate, setReceptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [receptionId, setReceptionId] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [examinationResults, setExaminationResults] = useState<any[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDialog, setShowDialog] = useState(false);
  const [showReceptDialog, setShowReceptDialog] = useState(false);

  useEffect(() => {
    const pId = searchParams.get("patientId");
    const rId = searchParams.get("receptId");
    const rDate = searchParams.get("receptDate");
    if (pId) setPatientId(pId);
    if (rId) setReceptionId(rId);
    if (rDate) setReceptionDate(rDate);
  }, [searchParams]);

  const handleReceptSearch = async () => {
    if (!patientId) {
      setErrors((prev) => ({ ...prev, patientId: "先に患者IDを入力してください" }));
      return;
    }
    setShowReceptDialog(true);
  };

  const handleStart = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!patientId) newErrors.patientId = "患者IDを入力してください";
    if (!receptionDate) newErrors.receptionDate = "受診日を選択してください";
    if (!receptionId) newErrors.receptionId = "受付IDを入力してください";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShowResults(false);
      return;
    }

    // 患者存在チェック
    const { data: patientData, error: patientError } = await supabase
      .from("patient_basic")
      .select("id, name")
      .eq("id", patientId)
      .single();

    if (patientError || !patientData) {
      setErrors({ patientId: "登録されていない患者IDです" });
      setShowResults(false);
      return;
    }

    setPatientName(patientData.name);

    // 受付存在チェック
    const { data: receptData, error: receptError } = await supabase
      .from("recept")
      .select("id, recept_id")
      .eq("recept_id", receptionId)
      .eq("patient_id", patientId)
      .eq("recept_date", receptionDate)
      .single();

    if (receptError || !receptData) {
      setErrors({ receptionId: "指定の患者IDに対する受付データが見つかりません" });
      setShowResults(false);
      return;
    }

    setErrors({});
    setShowResults(true);
    // ここで実際のデータ取得ロジックを今後実装
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <AppHeader />
      <main className="flex-1 w-full py-8 px-4">
        <div className="max-w-4xl w-full mx-auto space-y-6">
          <PatientSearchDialog
            isOpen={showDialog}
            onClose={() => setShowDialog(false)}
            onSelect={(p) => {
              setPatientId(p.id.toString());
              setPatientName(p.name);
              if (errors.patientId) setErrors((prev) => ({ ...prev, patientId: "" }));
              setShowDialog(false);
            }}
            themeColor="blue"
          />

          <ReceptSearchDialog
            isOpen={showReceptDialog}
            onClose={() => setShowReceptDialog(false)}
            onSelect={(r) => {
              setReceptionId(r.recept_id.toString());
              setReceptionDate(r.recept_date);
              if (errors.receptionId) setErrors((prev) => ({ ...prev, receptionId: "" }));
              if (errors.receptionDate) setErrors((prev) => ({ ...prev, receptionDate: "" }));
              setShowReceptDialog(false);
            }}
            patientId={patientId}
            themeColor="blue"
          />

          <ReceptStartForm
            title="検査結果表示"
            description="患者IDと受付IDを入力して、検査結果を表示してください。"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            onSubmit={handleStart}
            submitLabel="結果を表示する"
            themeColor="blue"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <div className="relative">
                <label className="block text-sm font-bold text-slate-600 mb-2">患者ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="例: 1001"
                    className={`flex-1 px-4 py-3 bg-slate-50/50 border ${errors.patientId ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-slate-700`}
                    value={patientId}
                    onChange={e => {
                      setPatientId(e.target.value);
                      if (errors.patientId) setErrors(prev => ({ ...prev, patientId: "" }));
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDialog(true)}
                    className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors shadow-sm flex items-center justify-center shrink-0 group"
                    title="患者IDを検索"
                  >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
                  className={`w-full px-4 py-3 bg-slate-50/50 border ${errors.receptionDate ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-slate-700`}
                  value={receptionDate}
                  onChange={e => {
                    setReceptionDate(e.target.value);
                    if (errors.receptionDate) setErrors(prev => ({ ...prev, receptionDate: "" }));
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
                    className={`flex-1 px-4 py-3 bg-slate-50/50 border ${errors.receptionId ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none font-bold text-slate-700`}
                    value={receptionId}
                    onChange={e => {
                      setReceptionId(e.target.value);
                      if (errors.receptionId) setErrors(prev => ({ ...prev, receptionId: "" }));
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleReceptSearch}
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

          {showResults ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">検査結果表示</h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {patientName} 様（受診日: {receptionDate}）の検査結果です。
                  </p>
                </div>
              </div>
              
              <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-lg font-medium">ここに検査結果のリストや詳細が表示されます。</p>
                <p className="text-sm">データの検索やフィルタリング機能も今後実装予定です。</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">患者IDと受付IDを入力して「結果を表示する」をクリックしてください。</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ResultsOutputPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <ResultsOutputContent />
    </Suspense>
  );
}
