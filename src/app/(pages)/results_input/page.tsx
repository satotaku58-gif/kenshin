"use client";

import AppHeader from "../../component/AppHeader";
import PatientSearchDialog from "../../component/PatientSearchDialog";
import ReceptSearchDialog from "../../component/ReceptSearchDialog";
import ReceptStartForm from "../../component/ReceptStartForm";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../supabaseClient";

export default function ResultsInputPage() {
  const searchParams = useSearchParams();

  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [receptionDate, setReceptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [receptionId, setReceptionId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [examinationItems, setExaminationItems] = useState<any[]>([]);
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
      setShowForm(false);
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
      setShowForm(false);
      return;
    }

    setPatientName(patientData.name);

    // 受付存在チェック
    const { data: receptData, error: receptError } = await supabase
      .from("recept")
      .select("id, recept_id, course")
      .eq("recept_id", receptionId)
      .eq("patient_id", patientId)
      .eq("recept_date", receptionDate)
      .single();

    if (receptError || !receptData) {
      setErrors({ receptionId: "指定の患者IDに対する受付データが見つかりません" });
      setShowForm(false);
      return;
    }

    // 2. コースに紐づく検査項目を取得
    const { data: courseItems, error: courseItemsError } = await supabase
      .from("kensa_course_items")
      .select("item_id")
      .eq("course_id", receptData.course);

    if (courseItemsError || !courseItems) {
      console.error("Course items fetch error:", courseItemsError);
      setErrors({ receptionId: "コース項目を読み取れませんでした" });
      return;
    }

    const itemIds = courseItems.map(ci => ci.item_id);

    // 3. 検査項目のマスター情報を取得
    const { data: itemMaster, error: itemMasterError } = await supabase
      .from("kensa_item_master")
      .select("*")
      .in("id", itemIds)
      .order("id", { ascending: true });

    if (itemMasterError || !itemMaster) {
      console.error("Item master fetch error:", itemMasterError);
      setErrors({ receptionId: "検査項目マスターを読み取れませんでした" });
      return;
    }

    setExaminationItems(itemMaster);
    setErrors({});
    setShowForm(true);
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
            themeColor="amber"
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
            themeColor="amber"
          />

          <ReceptStartForm
            title="検査結果入力"
            description="患者IDと受付IDを入力して、検査結果の入力を開始してください。"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            }
            onSubmit={handleStart}
            submitLabel="結果入力を開始する"
            themeColor="amber"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <div className="relative">
                <label className="block text-sm font-bold text-slate-600 mb-2">患者ID</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="例: 1001"
                    className={`flex-1 px-4 py-3 bg-slate-50/50 border ${errors.patientId ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none font-bold text-slate-700`}
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
                  className={`w-full px-4 py-3 bg-slate-50/50 border ${errors.receptionDate ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none font-bold text-slate-700`}
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
                    className={`flex-1 px-4 py-3 bg-slate-50/50 border ${errors.receptionId ? 'border-red-500 bg-red-50/50' : 'border-slate-200'} rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none font-bold text-slate-700`}
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

          {showForm && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-100">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">結果入力フォーム</h2>
                  <p className="text-sm text-slate-500 font-medium">
                    {patientName} 様（受診日: {receptionDate}）の検査結果を入力してください。
                  </p>
                </div>
              </div>

              <div className="overflow-hidden border border-slate-100 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">項目名</th>
                      <th className="px-6 py-4">略記</th>
                      <th className="px-6 py-4">単位</th>
                      <th className="px-6 py-4">基準値 (下限)</th>
                      <th className="px-6 py-4">基準値 (上限)</th>
                      <th className="px-6 py-4">入力値</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {examinationItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                          表示できる検査項目がありません。
                        </td>
                      </tr>
                    ) : (
                      examinationItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-700">{item.name}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 font-mono">{item.abbrev || "-"}</td>
                          <td className="px-6 py-4 text-sm text-slate-500">{item.unit || "-"}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 font-mono">{item.min_val ?? "-"}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 font-mono">{item.max_val ?? "-"}</td>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              placeholder="入力"
                              className="w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none font-bold text-slate-700 text-sm"
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-200 hover:bg-amber-600 hover:shadow-amber-100 transition-all active:scale-95 flex items-center gap-2 group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>検査結果を保存する</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
