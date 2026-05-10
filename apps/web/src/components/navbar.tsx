'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../contexts/auth-context';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isActive = (href: string) =>
    pathname === href ? 'text-green-600 font-medium' : 'text-gray-600 hover:text-green-600';

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-green-600">
          SafeEats
        </Link>
        <div className="flex items-center gap-5 text-sm">
          <Link href="/recalls" className={isActive('/recalls')}>
            리콜 목록
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className={isActive('/dashboard')}>
                대시보드
              </Link>
              <Link href="/subscribe" className={isActive('/subscribe')}>
                구독 관리
              </Link>
              <Link href="/settings/notifications" className={isActive('/settings/notifications')}>
                알림 설정
              </Link>
              <span className="text-gray-300">|</span>
              <span className="text-gray-500 text-xs">{user.email}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-500 hover:text-red-600 transition"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={isActive('/login')}>
                로그인
              </Link>
              <Link
                href="/signup"
                className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
