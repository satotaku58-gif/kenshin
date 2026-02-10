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

    if (pathname === '/login') {
      if (isAuth) {
        // ログイン済みでログインページにアクセスした場合は患者情報入力へ
        router.push('/patient_basic');
      } else {
        setIsAuthenticated(false);
      }
      return;
    }

    // ルートパス（/）へのアクセス時
    if (pathname === '/') {
      if (isAuth) {
        router.push('/patient_basic');
      } else {
        router.push('/login');
      }
      return;
    }

    if (!isAuth) {
      // 未ログインの場合はログインページへリダイレクト
      setIsAuthenticated(false);
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  // 判定中、または未ログイン（リダイレクト前）は何も表示しない
  if (isAuthenticated === false && pathname !== '/login') {
    return null;
  }

  // ログインページ、または認証済みの場合のみ表示
  return <>{children}</>;
}
