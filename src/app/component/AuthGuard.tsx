'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // クッキーから認証情報を取得
    const cookies = document.cookie.split('; ');
    const authToken = cookies.find(row => row.startsWith('auth_token='));
    const isAuth = authToken?.split('=')[1] === 'authenticated';

    if (pathname === '/login') {
      if (isAuth) {
        // ログイン済みでログインページにアクセスした場合はTOPへ
        router.push('/');
      } else {
        setIsAuthenticated(false);
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

  // 判定中、または未ログイン（リダイレクト前）は何も表示しない（またはローディング）
  if (pathname !== '/login' && isAuthenticated === false) {
    return null;
  }

  // ログインページ、または認証済みの場合のみ表示
  return <>{children}</>;
}
