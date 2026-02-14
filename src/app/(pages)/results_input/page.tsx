"use client";

import AppHeader from "../../component/AppHeader";
import PatientSearchDialog from "../../component/PatientSearchDialog";
import ReceptSearchDialog from "../../component/ReceptSearchDialog";
import ReceptStartForm from "../../component/ReceptStartForm";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../supabaseClient";
import { useResultsInput } from "../../context/ResultsInputContext";

function ResultsInputContent() {
  const searchParams = useSearchParams();
  const {
    patientId, setPatientId,
    patientName, setPatientName,
    receptionDate, setReceptionDate,
    receptionId, setReceptionId,
    receptPk, setReceptPk,
    examinationItems, setExaminationItems,
    showForm, setShowForm,
    isLoaded
  } = useResultsInput();

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDialog, setShowDialog] = useState(false);
  const [showReceptDialog, setShowReceptDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: "", type: "" });

  useEffect(() => {
    if (!isLoaded) return;
    const pId = searchParams.get("patientId");
    const rId = searchParams.get("receptId");
    const rDate = searchParams.get("receptDate");
    if (pId) setPatientId(pId);
    if (rId) setReceptionId(rId);
    if (rDate) setReceptionDate(rDate);
  }, [searchParams, isLoaded]);

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

    setReceptPk(receptData.id);

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

    // 3. 検査項目のマスター情報と、リレーション先のデータ型・選択肢を取得
    const { data: itemMaster, error: itemError } = await supabase
      .from("kensa_item_master")
      .select(`
        *,
        valuetype_info:kensa_valuetype_master (
          id,
          name,
          selectable,
          kensa_select_item_master (
            id,
            text
          )
        )
      `)
      .in("id", itemIds)
      .order("id", { ascending: true });

    if (itemError || !itemMaster) {
      console.error("Master fetch error:", itemError);
      setErrors({ receptionId: "マスター情報を読み取れませんでした" });
      return;
    }

    // 4. すでに保存されている結果があれば取得
    const { data: existingResults, error: resultsError } = await supabase
      .from("kensa_result")
      .select("kensa_item, answer")
      .eq("recept_id", receptData.id);

    if (resultsError) {
      console.error("Existing results fetch error:", resultsError);
      // 結果の取得失敗は致命的ではないので続行
    }

    const resultsMap = new Map();
    existingResults?.forEach(r => {
      resultsMap.set(r.kensa_item, r.answer);
    });

    // 取得したデータを使いやすい形式に整形
    const itemsWithTypes = itemMaster.map((item: any) => {
      const typeInfo = item.valuetype_info;
      const isSelectable = typeInfo?.selectable || false;
      const options = isSelectable ? (typeInfo?.kensa_select_item_master || []) : [];
      
      // 保存済みの値があればセット
      const existingValue = resultsMap.get(item.id);

      return {
        ...item,
        typeName: typeInfo?.name || "unknown",
        isSelectable,
        options,
        value: existingValue !== undefined ? existingValue.toString() : "",
        isExisting: existingValue !== undefined
      };
    });

    setExaminationItems(itemsWithTypes);
    setErrors({});
    setShowForm(true);
  };

  const handleInputChange = (itemId: number, value: string, type: string, isSelectable: boolean) => {
    // 選択式の場合はバリデーション不要（そのままセット）
    if (isSelectable) {
      setExaminationItems(prev => prev.map(item => 
        item.id === itemId ? { ...item, value } : item
      ));
      return;
    }

    // データ型に応じたバリデーション
    let filteredValue = value;
    if (type === "int") {
      filteredValue = value.replace(/[^0-9]/g, "");
    } else if (type === "float") {
      filteredValue = value.replace(/[^0-9.]/g, "");
      const parts = filteredValue.split(".");
      if (parts.length > 2) {
        filteredValue = parts[0] + "." + parts.slice(1).join("");
      }
    } else if (type === "bool") {
      // boolの場合は別途セレクトボックスにするが、ここでも通る可能性を考慮
      filteredValue = value;
    }
    
    setExaminationItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, value: filteredValue } : item
    ));
  };

  const handleSave = async () => {
    if (!receptPk) return;
    
    setIsSaving(true);
    setSaveMessage({ text: "", type: "" });

    try {
      // 保存するデータの抽出（値があるもののみ、数値を数値として送信）
      const resultsToSave = examinationItems
        .filter(item => item.value !== undefined && item.value !== "")
        .map(item => ({
          recept_id: receptPk,
          kensa_item: item.id,
          answer: parseFloat(item.value)
        }));

      if (resultsToSave.length === 0) {
        setSaveMessage({ text: "保存するデータがありません。", type: "error" });
        setIsSaving(false);
        return;
      }

      // kensa_result テーブルへ保存 (upsertを使用)
      const { error } = await supabase
        .from("kensa_result")
        .upsert(resultsToSave, { onConflict: "recept_id,kensa_item" });

      if (error) throw error;

      setSaveMessage({ text: "検査結果を保存しました。", type: "success" });
    } catch (err: any) {
      console.error("Save error:", err);
      setSaveMessage({ text: "エラーが発生しました。保存できませんでした。", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const renderInput = (item: any) => {
    const { typeName, id, value = "", isSelectable, options } = item;

    // 選択式の場合 (selectable=true)
    if (isSelectable) {
      return (
        <select
          value={value}
          onChange={(e) => handleInputChange(id, e.target.value, typeName, true)}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none font-bold text-slate-700 text-sm"
        >
          <option value="">選択してください</option>
          {options.map((opt: any, index: number) => (
            <option key={opt.id} value={index}>{opt.text}</option>
          ))}
        </select>
      );
    }

    // 非選択式で bool の場合
    if (typeName === "bool") {
      return (
        <select
          value={value}
          onChange={(e) => handleInputChange(id, e.target.value, typeName, false)}
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none font-bold text-slate-700 text-sm"
        >
          <option value="">選択</option>
          <option value="1">はい</option>
          <option value="0">いいえ</option>
        </select>
      );
    }

    // それ以外 (int, float, text など)
    return (
      <input
        type="text"
        placeholder="入力"
        value={value}
        onChange={(e) => handleInputChange(id, e.target.value, typeName, false)}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all outline-none font-bold text-slate-700 text-sm text-right"
      />
    );
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

          {showForm ? (
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
                      <th className="px-6 py-4">結果</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {examinationItems.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-6 py-12 text-center text-slate-400 font-medium">
                          表示できる検査項目がありません。
                        </td>
                      </tr>
                    ) : (
                      examinationItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-700">{item.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 justify-start">
                              <div className="w-48 flex items-center gap-2">
                                {renderInput(item)}
                              </div>
                              <div className="w-20">
                                {item.unit && (
                                  <span className="text-sm text-slate-500 font-medium">{item.unit}</span>
                                )}
                              </div>
                              {item.isExisting && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 rounded-lg animate-in fade-in zoom-in duration-300">
                                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-[11px] font-bold whitespace-nowrap">入力済み</span>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 flex justify-end items-center gap-4">
                {saveMessage.text && (
                  <span className={`text-sm font-bold ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                    {saveMessage.text}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-200 hover:bg-amber-600 hover:shadow-amber-100 transition-all active:scale-95 flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className={`w-5 h-5 ${isSaving ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isSaving ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    )}
                  </svg>
                  <span>{isSaving ? "保存中..." : "検査結果を保存する"}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">患者IDと受付IDを入力して「結果入力を開始する」をクリックしてください。</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ResultsInputPage() {
  return (
    <Suspense fallback={<div>読み込み中...</div>}>
      <ResultsInputContent />
    </Suspense>
  );
}
