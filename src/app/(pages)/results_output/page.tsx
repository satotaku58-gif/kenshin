"use client";

import AppHeader from "../../component/AppHeader";

export default function ResultsOutputPage() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans">
      <AppHeader />
      <main className="flex-1 w-full py-8 px-4">
        <div className="max-w-4xl w-full mx-auto space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800">検査結果表示</h2>
                <p className="text-sm text-slate-500 font-medium">登録済みの検査結果を表示・確認するページです（開発中）。</p>
              </div>
            </div>
            
            <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
              <p className="text-lg font-medium">ここに検査結果のリストや詳細が表示されます。</p>
              <p className="text-sm">データの検索やフィルタリング機能も今後実装予定です。</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
