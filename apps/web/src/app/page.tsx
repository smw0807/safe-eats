import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-green-600 mb-4">SafeEats</h1>
        <p className="text-xl text-gray-600 mb-8">식품 안전 리콜 모니터링 서비스</p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/recalls"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            리콜 목록 보기
          </Link>
          <Link
            href="/nutrition"
            className="px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition"
          >
            영양성분 조회
          </Link>
        </div>
      </div>
    </main>
  );
}
