import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../contexts/auth-context';
import Navbar from '../components/navbar';
import PushToastContainer from '../components/PushToastContainer';

export const metadata: Metadata = {
  title: 'SafeEats - 식품 안전 리콜 모니터링',
  description: '식약처 식품 리콜 정보를 실시간으로 모니터링하고 알림을 받으세요.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <AuthProvider>
          <Navbar />
          {children}
          <PushToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
