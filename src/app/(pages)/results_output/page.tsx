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
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [itemMasters, setItemMasters] = useState<any[]>([]);
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

    // 過去の受診履歴を最大4件取得（今回分を含む）
    const { data: receptHistory, error: historyError } = await supabase
      .from("recept")
      .select("id, recept_id, recept_date")
      .eq("patient_id", patientId)
      .lte("recept_date", receptionDate) // 今回の受診日以前
      .order("recept_date", { ascending: false })
      .limit(4);

    if (historyError || !receptHistory || receptHistory.length === 0) {
      setErrors({ receptionId: "受診履歴が見つかりません" });
      setShowResults(false);
      return;
    }

    const receptIds = receptHistory.map(r => r.id);

    // 項目マスターを取得
    const { data: masters, error: masterEditor } = await supabase
      .from("kensa_item_master")
      .select("*")
      .order("id", { ascending: true });

    if (masters) setItemMasters(masters);

    // 全履歴分の結果を取得
    const { data: results, error: resultsError } = await supabase
      .from("kensa_result")
      .select("recept_id, kensa_item, answer")
      .in("recept_id", receptIds);

    if (resultsError) {
      console.error("Results fetch error:", resultsError);
    }

    // データを整形
    const historyWithResults = receptHistory.map(r => {
      const dayResults = results?.filter(res => res.recept_id === r.id) || [];
      const resultMap = new Map();
      dayResults.forEach(dr => resultMap.set(dr.kensa_item, dr.answer));
      return {
        ...r,
        results: resultMap
      };
    });

    setHistoryData(historyWithResults); // 降順（左が最新）でセット
    setErrors({});
    setShowResults(true);
  };

  const getValue = (historyItem: any, itemName: string) => {
    const master = itemMasters.find(m => m.name === itemName);
    if (!master) return "-";
    return historyItem.results.get(master.id) || "-";
  };

  const TableRow = ({ label, itemName, unit = "" }: { label: string, itemName: string, unit?: string }) => (
    <tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
      <td className="py-2 px-3 text-sm font-bold text-slate-600 bg-slate-50 border-r border-slate-200 sticky left-0 z-10">
        {label} <span className="text-[10px] font-normal text-slate-400">{unit}</span>
      </td>
      <td className="py-2 px-3 text-center border-r border-slate-200">
        {/* 基準値（空欄） */}
      </td>
      {historyData.map((h, i) => (
        <td key={i} className={`py-2 px-3 text-center font-bold text-slate-700 border-r border-slate-200 ${i === 0 ? 'bg-blue-50/30 text-blue-700' : ''}`}>
          {getValue(h, itemName)}
        </td>
      ))}
    </tr>
  );

  const GroupHeader = ({ label, icon }: { label: string, icon: React.ReactNode }) => (
    <tr className="bg-slate-100/80">
      <td colSpan={2 + historyData.length} className="py-1.5 px-3 text-[11px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
        {icon}
        {label}
      </td>
    </tr>
  );

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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* ヘッダー部分 */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{patientName} 様 検査結果比較表</h2>
                    <p className="text-sm text-slate-500 font-medium">過去の経時変化をご確認いただけます。</p>
                  </div>
                </div>
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  印刷する
                </button>
              </div>

              {/* テーブル本体 */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="py-4 px-3 text-left border-b-2 border-slate-200 sticky left-0 z-10 bg-slate-50 min-w-[140px]">項目名</th>
                      <th className="py-4 px-3 text-center border-b-2 border-slate-200 min-w-[100px] text-slate-500 text-xs uppercase font-black">基準値</th>
                      {historyData.map((h, i) => (
                        <th key={i} className={`py-4 px-3 text-center border-b-2 border-slate-200 min-w-[120px] ${i === 0 ? 'border-b-blue-500' : ''}`}>
                          <div className={`text-xs font-black ${i === 0 ? 'text-blue-600' : 'text-slate-500'}`}>受診日</div>
                          <div className={`text-sm font-bold ${i === 0 ? 'text-blue-700' : 'text-slate-700'}`}>{h.recept_date.replace(/-/g, '/')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <GroupHeader 
                      label="身体計測" 
                      icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>} 
                    />
                    <TableRow label="身長" itemName="身長" unit="cm" />
                    <TableRow label="体重" itemName="体重" unit="kg" />
                    <TableRow label="BMI" itemName="BMI" />
                    <TableRow label="腹囲" itemName="腹囲" unit="cm" />

                    <GroupHeader 
                      label="血圧" 
                      icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>} 
                    />
                    <TableRow label="最高血圧" itemName="最高血圧" unit="mmHg" />
                    <TableRow label="最低血圧" itemName="最低血圧" unit="mmHg" />
                    <tr className="border-b border-slate-200 bg-slate-50/30">
                      <td className="py-2 px-3 text-[10px] font-bold text-slate-400 bg-slate-50 border-r border-slate-200 italic sticky left-0 z-10">判定 (血圧)</td>
                      <td className="border-r border-slate-200"></td>
                      {historyData.map((_, i) => (
                        <td key={i} className="py-2 px-3 text-center text-xs font-bold text-slate-500 border-r border-slate-200 italic">-</td>
                      ))}
                    </tr>

                    <GroupHeader 
                      label="視力・聴力" 
                      icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} 
                    />
                    <TableRow label="視力(右)" itemName="視力（右）" />
                    <TableRow label="視力(左)" itemName="視力（左）" />
                    <TableRow label="聴力右1000Hz" itemName="聴力右1000Hz" />
                    <TableRow label="聴力右4000Hz" itemName="聴力右4000Hz" />
                    <TableRow label="聴力左1000Hz" itemName="聴力左1000Hz" />
                    <TableRow label="聴力左4000Hz" itemName="聴力左4000Hz" />

                    <GroupHeader 
                      label="尿検査" 
                      icon={<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.673.337a4 4 0 01-2.574.345l-3.141-.628a2 2 0 00-1.88 2.383l.721 3.605A2 2 0 005.627 22h12.746a2 2 0 001.963-1.584l.721-3.605a2 2 0 00-1.63-2.383z" /></svg>} 
                    />
                    <TableRow label="尿蛋白" itemName="尿蛋白" />
                    <TableRow label="尿糖" itemName="尿糖" />
                    <TableRow label="ウロビリノーゲン" itemName="尿ウロビリノーゲン" />
                    <TableRow label="尿潜血" itemName="尿潜血" />
                    <tr className="border-b border-slate-200 bg-slate-50/30">
                      <td className="py-2 px-3 text-[10px] font-bold text-slate-400 bg-slate-50 border-r border-slate-200 italic sticky left-0 z-10">判定 (尿検査)</td>
                      <td className="border-r border-slate-200"></td>
                      {historyData.map((_, i) => (
                        <td key={i} className="py-2 px-3 text-center text-xs font-bold text-slate-500 border-r border-slate-200 italic">-</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 italic text-[10px] text-slate-400 text-right">
                ※判定および基準値は現在開発中のためモック表示となっています。
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
