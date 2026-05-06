export default function RecallDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">리콜 상세</h1>
      <p className="text-gray-500">ID: {params.id}</p>
    </main>
  );
}
