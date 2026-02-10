"use client";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const AppHeader = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: "患者情報入力", path: "/patient_basic" },
    { name: "検査受付入力", path: "/reception" },
    { name: "問診入力", path: "/questionnaire" },
    { name: "検査結果入力", path: "/results_input" },
    { name: "検査結果表示", path: "/results_output" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <nav className="max-w-6xl mx-auto flex items-center justify-between py-4 px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-cyan-200 group-hover:rotate-3 transition-transform">
              <span className="text-white font-bold text-xl">佐</span>
            </div>
            <div className="flex flex-col leading-tight">
              <h1 className="text-lg font-bold text-slate-800">佐藤健診システム</h1>
              <span className="text-[10px] text-cyan-600 font-bold uppercase tracking-wider">Health Check System</span>
            </div>
          </Link>
        </div>
        
        <ul className="hidden lg:flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all duration-200 ${
                    isActive
                      ? "bg-cyan-50 text-cyan-700 shadow-sm ring-1 ring-cyan-100"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3">
          <button className="hidden lg:flex px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
            ログアウト
          </button>
          <button 
            className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white">
          <ul className="flex flex-col p-4 gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-3 rounded-lg text-sm font-bold transition-all duration-200 ${
                      isActive
                        ? "bg-cyan-50 text-cyan-700 shadow-sm ring-1 ring-cyan-100"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2 pt-2 border-t border-slate-50">
              <button className="w-full px-4 py-3 text-sm font-bold text-left text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                ログアウト
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
