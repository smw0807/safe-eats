import RecallsClient from './RecallsClient';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

async function fetchRecalls() {
  try {
    const res = await fetch(`${API_URL}/recalls?page=1&limit=20`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('fetch failed');
    return res.json();
  } catch {
    return { recalls: [], total: 0, page: 1, limit: 20, totalPages: 1 };
  }
}

export default async function RecallsPage() {
  const initialData = await fetchRecalls();

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">리콜 목록</h1>
        <p className="text-gray-500 text-sm">식약처 식품 회수·판매중지 정보를 확인하세요.</p>
      </div>
      <RecallsClient initialData={initialData} />
    </main>
  );
}
