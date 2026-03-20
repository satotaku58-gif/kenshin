'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/app/supabaseClient';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // ログインページかどうか
  const isLoginPage = useMemo(() => {
    if (!pathname) return false;
    const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
    return normalizedPath === '/login' || normalizedPath === '/';
  }, [pathname]);

  useEffect(() => {
    let mounted = true;

    // 1. 初回のセッション確認
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          
          // 未ログインでログインページ以外にいる場合はリダイレクト
          if (!initialSession && !isLoginPage) {
            router.push('/login');
          }
          // ログイン済みでログインページ（またはルート）にいる場合はリダイレクト
          if (initialSession && isLoginPage) {
            router.push('/patient_basic');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // 2. 状態変化の監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (!mounted) return;
      
      setSession(currentSession);
      setLoading(false);

      if (event === 'SIGNED_IN' && isLoginPage) {
        router.push('/patient_basic');
      } else if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isLoginPage, router]);

  // 常に表示を許可する例外（ログインページ）
  if (isLoginPage) {
    return <>{children}</>;
  }

  // ローディング中の表示
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  // ログイン済み
  if (session) {
    return <>{children}</>;
  }

  // 未ログインで保護ページにいる場合は何も出さずにリダイレクトを待つ
  return null;
}
