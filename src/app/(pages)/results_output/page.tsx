"use client";

import AppHeader from "../../component/AppHeader";
import PatientSearchDialog from "../../component/PatientSearchDialog";
import ReceptSearchDialog from "../../component/ReceptSearchDialog";
import CommonStartForm from "../../component/CommonStartForm";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../supabaseClient";
import { fetchPatientBasic, validateReception } from "../../api/receptApi";

function ResultsOutputContent() {
  const searchParams = useSearchParams();

  const [patientId, setPatientId] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientBirth, setPatientBirth] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [receptionDate, setReceptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [receptionId, setReceptionId] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [itemMasters, setItemMasters] = useState<any[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showDialog, setShowDialog] = useState(false);
  const [showReceptDialog, setShowReceptDialog] = useState(false);
  const [findings, setFindings] = useState("");
  const [judge, setJudge] = useState("判定しない");

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return "";
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  useEffect(() => {
    const pId = searchParams.get("patientId");
    const rId = searchParams.get("receptId");
    const rDate = searchParams.get("receptDate");
    if (pId) setPatientId(pId);
    if (rId) setReceptionId(rId);
    if (rDate) setReceptionDate(rDate);
  }, [searchParams]);

  const handleReceptSearch = async () => {
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

    try {
      // 患者存在チェック
      const patientData = await fetchPatientBasic(patientId);

      setPatientName(patientData.name);
      setPatientBirth(patientData.birthdate || "");
      setPatientGender(patientData.sex === 1 ? "男性" : patientData.sex === 2 ? "女性" : patientData.sex === 9 ? "その他" : "-");

      // 受付存在チェック (整合性の確認のみ)
      await validateReception(patientId, receptionDate, receptionId);

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

    // 項目マスターをカテゴリ情報付きで取得
    const { data: masters, error: masterError } = await supabase
      .from("kensa_item_master")
      .select(`
        *,
        category:kensa_category_master (
          name
        )
      `)
      .order("category_id", { ascending: true })
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
    } catch (err: any) {
      setErrors({ [err.message.includes("患者") ? "patientId" : "receptionId"]: err.message });
      setShowResults(false);
    }
  };

  const TableRow = ({ item }: { item: any }) => (
    <tr className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors group">
      <td className="py-3 px-4 text-sm font-semibold text-slate-700 bg-white border-r border-slate-100 sticky left-0 z-10 group-hover:bg-blue-50/30 transition-colors">
        <div className="flex flex-col">
          <span>{item.name}</span>
          {item.unit && (
            <span className="text-[10px] font-medium text-slate-400 mt-0.5 leading-none">
              {item.unit}
            </span>
          )}
        </div>
      </td>
      {historyData.map((h, i) => (
        <td 
          key={i} 
          className={`py-3 px-4 text-center font-mono text-[13px] border-r border-slate-100 ${
            i === 0 ? 'bg-yellow-50/30 font-bold text-yellow-800' : 'text-slate-600'
          }`}
        >
          {h.results.get(item.id) || "-"}
        </td>
      ))}
      <td className="py-3 px-4 text-center text-slate-400 text-[11px] font-medium">
        -
      </td>
    </tr>
  );

  const GroupHeader = ({ label }: { label: string }) => (
    <tr className="bg-slate-50/50 backdrop-blur-sm">
      <td 
        colSpan={2 + historyData.length} 
        className="py-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] border-y border-slate-100"
      >
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-[2px] bg-slate-300 rounded-full"></div>
          {label}
        </div>
      </td>
    </tr>
  );

  const PrintTable = ({ groups }: { groups: { categoryName: string, items: any[] }[] }) => (
    <div className="flex-1 min-w-0">
      <table className="w-full border-collapse border-t-2 border-slate-900 text-[9px] text-black">
        <thead>
          <tr className="bg-slate-50">
            <th className="py-1 px-2 text-left border-b border-r border-slate-300 w-8 font-bold bg-slate-100/50">分類</th>
            <th className="py-1 px-2 text-left border-b border-r border-slate-300 w-32 font-bold bg-slate-100/50">項目名</th>
            {historyData.map((h, i) => (
              <th key={i} className={`py-1 px-1 text-center border-b border-r border-slate-300 min-w-[45px] ${i === 0 ? 'bg-slate-100 font-bold' : 'font-medium'}`}>
                <div className="scale-90">{h.recept_date.substring(5).replace(/-/g, '/')}</div>
              </th>
            ))}
            <th className="py-1 px-1 text-center border-b border-slate-300 w-14 font-bold">基準値</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group, gIdx) => (
            <React.Fragment key={gIdx}>
              {group.items.map((item, iIdx) => (
                <tr key={iIdx} className="border-b border-slate-100">
                  {iIdx === 0 && (
                    <td 
                      rowSpan={group.items.length} 
                      className="py-1 px-2 border-r border-slate-300 font-black text-[7px] uppercase tracking-tighter bg-slate-50/30"
                      style={{ verticalAlign: 'middle', writingMode: 'vertical-lr' }}
                    >
                      {group.categoryName}
                    </td>
                  )}
                  <td className="py-1 px-2 border-r border-slate-200 font-medium">
                    <div className="flex justify-between items-baseline gap-1">
                      <span>{item.name}</span>
                      {item.unit && <span className="text-[7px] font-normal">{item.unit}</span>}
                    </div>
                  </td>
                  {historyData.map((h, i) => (
                    <td key={i} className={`py-1 px-1 text-center border-r border-slate-200 font-mono ${i === 0 ? 'bg-yellow-50/30 font-bold' : ''}`}>
                      {h.results.get(item.id) || "-"}
                    </td>
                  ))}
                  <td className="py-1 px-1 text-center font-mono">-</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );

  const groupedData = React.useMemo(() => {
    const presentItemIds = new Set();
    historyData.forEach(h => {
      h.results.forEach((_: any, itemId: any) => presentItemIds.add(itemId));
    });

    const visibleItems = itemMasters.filter(item => presentItemIds.has(item.id));

    const result: { categoryId: any, categoryName: string, items: any[] }[] = [];
    let lastCategoryId: any = null;

    visibleItems.forEach(item => {
      if (item.category_id !== lastCategoryId) {
        lastCategoryId = item.category_id;
        result.push({
          categoryId: item.category_id,
          categoryName: item.category?.name || "その他",
          items: []
        });
      }
      result[result.length - 1].items.push(item);
    });
    
    return result;
  }, [historyData, itemMasters]);

  const splitIndex = React.useMemo(() => {
    const totalItems = groupedData.reduce((acc, g) => acc + g.items.length, 0);
    // 所見欄の高さを項目数（約6項目分）として換算
    const findingsWeight = 6;
    const targetWeight = (totalItems + findingsWeight) / 2;
    
    let currentWeight = 0;
    for (let i = 0; i < groupedData.length; i++) {
      const nextWeight = currentWeight + groupedData[i].items.length;
      if (nextWeight >= targetWeight) {
        // 半分を超える前と後のどちらがよりバランスが良いか比較
        if (Math.abs(targetWeight - currentWeight) < Math.abs(nextWeight - targetWeight)) {
          return i || 1; // 最低1つは左へ
        }
        return i + 1;
      }
      currentWeight = nextWeight;
    }
    return Math.ceil(groupedData.length / 2);
  }, [groupedData]);

  return (
    <div className="flex min-h-screen print:block flex-col bg-slate-50 print:bg-white font-sans">
      <div className="print:hidden">
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
            themeColor="yellow"
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
            themeColor="yellow"
          />

          <CommonStartForm
            title="検査結果表示"
            description="患者IDと受付IDを入力して、検査結果を表示してください。"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            onSubmit={handleStart}
            submitLabel="結果を表示する"
            themeColor="yellow"
            patientId={patientId}
            setPatientId={setPatientId}
            receptionDate={receptionDate}
            setReceptionDate={setReceptionDate}
            receptionId={receptionId}
            setReceptionId={setReceptionId}
            errors={errors}
            setErrors={setErrors}
            onPatientSearchClick={() => setShowDialog(true)}
            onReceptSearchClick={handleReceptSearch}
          />

          {showResults ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* ヘッダー部分 */}
              <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between bg-white sticky top-0 z-20 gap-4">
                <div className="flex flex-row items-center gap-4 sm:gap-6">
                  <div className="flex-none w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-yellow-100">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-baseline gap-2">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-800">{patientName} 様</h2>
                      <span className="text-xs sm:text-sm font-medium text-slate-400">検査結果比較表</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1.5">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded text-[10px] sm:text-[11px] font-bold text-slate-600">
                        <span className="text-slate-400">ID:</span>
                        <span className="font-mono">{patientId}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-[12px] text-slate-500 font-medium">
                        <span>{patientBirth.replace(/-/g, '/')} 生</span>
                        <span className="hidden sm:inline w-px h-3 bg-slate-200"></span>
                        <span>{patientGender}</span>
                        <span className="hidden sm:inline w-px h-3 bg-slate-200"></span>
                        <span className="text-slate-700 font-bold">{calculateAge(patientBirth)} 歳</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-4 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 shrink-0 shadow-sm sm:shadow-none"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  印刷する
                </button>
              </div>

              {/* 医師による判定・所見セクション */}
              <div className="p-4 sm:p-6 bg-slate-50/30 border-b border-slate-100">
                <div className="p-3 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-200/60 shadow-inner flex flex-col lg:flex-row items-stretch gap-4 sm:gap-6">
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2 px-1">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-wider">医師による判定・所見</span>
                    </div>
                    <textarea
                      value={findings}
                      onChange={(e) => setFindings(e.target.value)}
                      placeholder="こちらに所見を入力してください"
                      className="w-full p-2 sm:p-3 text-[12px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all font-medium text-slate-700 min-h-[80px] sm:min-h-[90px] shadow-sm placeholder:text-slate-300"
                      rows={3}
                    />
                  </div>
                  
                  <div className="w-full lg:w-[200px] flex flex-col gap-2 border-t lg:border-t-0 lg:border-l border-slate-200/50 pt-4 lg:pt-0 lg:pl-6">
                    <div className="flex items-center gap-2 px-1">
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-wider">総合判定</span>
                    </div>
                    <div className="relative group">
                      <select
                        value={judge}
                        onChange={(e) => setJudge(e.target.value)}
                        className="w-full appearance-none p-2 sm:p-3 pr-10 text-[12px] sm:text-[13px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500 transition-all font-black text-slate-800 shadow-sm cursor-pointer hover:border-slate-300"
                      >
                        <option value="判定しない">判定しない</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4 4 4-4" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 lg:mt-auto py-1 sm:py-2">
                       <div className="text-[10px] text-slate-400 font-medium leading-tight italic">
                         ※ 選択した判定は<br className="hidden lg:block"/>報告書に大きく印字されます。
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* テーブル本体 */}
              <div className="overflow-x-auto border-t border-slate-100">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="py-5 px-4 text-left border-b border-slate-200 sticky left-0 z-30 bg-slate-50/50 backdrop-blur-md min-w-[160px] shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">項目名</span>
                      </th>
                      {historyData.map((h, i) => (
                        <th key={i} className={`py-5 px-4 text-center border-b border-slate-200 min-w-[130px] ${i === 0 ? 'bg-yellow-50/20' : ''}`}>
                          <div className="flex flex-col items-center gap-1">
                            {i === 0 && (
                              <span className="px-2 py-0.5 bg-yellow-400 text-[9px] font-black text-white rounded-full leading-none mb-1">NEW</span>
                            )}
                            <div className={`text-[10px] font-bold tracking-tighter ${i === 0 ? 'text-yellow-600' : 'text-slate-400 uppercase'}`}>
                              {i === 0 ? '今回受診' : '前回以前'}
                            </div>
                            <div className={`text-sm font-black font-mono ${i === 0 ? 'text-yellow-900' : 'text-slate-600'}`}>
                              {h.recept_date.replace(/-/g, '/')}
                            </div>
                          </div>
                        </th>
                      ))}
                      <th className="py-5 px-4 text-center border-b border-slate-200 min-w-[100px]">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">基準値</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedData.map((group, gIdx) => (
                      <React.Fragment key={gIdx}>
                        <GroupHeader 
                          label={group.categoryName} 
                        />
                        {group.items.map((item: any) => (
                          <TableRow key={item.id} item={item} />
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium italic">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  判定および基準値は現在開発中のためモック表示となっています。
                </div>
                <div className="text-[10px] text-slate-300 font-mono select-none uppercase tracking-tighter">
                  Kenshin Management System v1.0
                </div>
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

    {/* 印刷用レイアウト (A4 Landscape) */}
    <div className="hidden print:block p-0 bg-white text-slate-900">
      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: landscape; margin: 10mm; }
        @media print {
          html, body { height: auto !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
          body { background: white; -webkit-print-color-adjust: exact; }
          .print-container { width: 100%; max-width: none; margin: 0; padding: 0; }
          .print\:hidden { display: none !important; }
        }
      `}} />
      <div className="max-w-none mx-auto print-container p-4">
        <div className="flex gap-8 items-stretch">
          {/* 左カラム */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className="flex justify-start items-end border-b-2 border-slate-900 pb-2 mb-6">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <div className="flex items-baseline gap-1.5 border-r border-slate-200 pr-4">
                  <span className="text-[8px] font-bold text-slate-400 tracking-widest">ID</span>
                  <span className="font-mono font-bold text-xl text-slate-900">{patientId}</span>
                </div>
                <div className="flex items-baseline gap-1.5 border-r border-slate-200 pr-4">
                  <span className="text-[8px] font-bold text-slate-400 tracking-widest">氏名</span>
                  <span className="font-bold text-xl text-slate-900">{patientName} <small className="text-slate-400 font-normal text-xs">様</small></span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-baseline gap-1">
                    <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">Birth</span>
                    <span className="font-bold text-[11px] text-slate-800">{patientBirth.replace(/-/g, '/')}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">Sex</span>
                    <span className="font-bold text-[11px] text-slate-800">{patientGender}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[8px] font-bold text-slate-400 tracking-widest uppercase">Age</span>
                    <span className="font-bold text-[11px] text-slate-800">{calculateAge(patientBirth)}歳</span>
                  </div>
                </div>
              </div>
            </div>
            <PrintTable 
              groups={groupedData.slice(0, splitIndex)}
            />
          </div>
          
          {/* 右カラム */}
          <div className="flex-1 min-w-0 flex flex-col">
            <PrintTable 
              groups={groupedData.slice(splitIndex)}
            />
            
            <div className="flex-1"></div>
            
            <div className="flex gap-4 mt-6 items-stretch">
              {/* 所見欄 */}
              <div className="border-2 border-slate-900 rounded-sm flex-[3] flex flex-col">
                <div className="bg-slate-900 text-white px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em]">医師所見</div>
                <div className="p-3 text-[11px] leading-relaxed whitespace-pre-wrap text-slate-900 flex-1 min-h-[140px] font-medium">
                  {findings || "（特記事項なし）"}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
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
