'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // LocalStorageから認証情報を取得
    const isAuth = typeof window !== 'undefined' && localStorage.getItem('auth_token') === 'authenticated';
    
    // パスを正規化（末尾のスラッシュを除去）
    const normalizedPathname = pathname === '/' ? '/' : pathname.replace(/\/$/, '');

    // 1. ログインページへのアクセス
    if (normalizedPathname === '/login') {
      if (isAuth) {
        router.replace('/patient_basic');
      } else {
        setIsAuthenticated(false);
      }
      return;
    }

    // 2. ルートパス (/) へのアクセス
    if (normalizedPathname === '/') {
      if (isAuth) {
        router.replace('/patient_basic');
      } else {
        router.replace('/login');
      }
      return;
    }

    // 3. その他の保護されたページへのアクセス
    if (!isAuth) {
      setIsAuthenticated(false);
      router.replace('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  // 判定中、または未ログイン（リダイレクト前）は何も表示しない
  if (isAuthenticated === null || (isAuthenticated === false && pathname !== '/login')) {
    return null;
  }

  // ログインページ、または認証済みの場合のみ表示
  return <>{children}</>;
}
