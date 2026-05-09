'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../contexts/auth-context';
import { api } from '../../../lib/api';
import type { Subscription } from '../../../types';

interface Props {
  productName: string;
  company: string;
}

export default function SubscriptionBanner({ productName, company }: Props) {
  const { token } = useAuth();
  const [matched, setMatched] = useState<Subscription[]>([]);

  useEffect(() => {
    if (!token) return;
    api.get<Subscription[]>('/subscriptions', token).then((subs) => {
      setMatched(
        subs.filter((sub) => productName.includes(sub.keyword) || company.includes(sub.keyword)),
      );
    });
  }, [token, productName, company]);

  if (!token) {
    return (
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-center text-green-700">
        <Link href="/login" className="font-medium hover:underline">
          로그인
        </Link>
        하면 이 제품이 내 구독 키워드와 일치하는지 확인할 수 있습니다.
      </div>
    );
  }

  if (matched.length === 0) return null;

  return (
    <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
      <p className="text-sm text-orange-700 font-medium">
        ⚠️ 내 구독 키워드와 일치합니다: {matched.map((m) => m.keyword).join(', ')}
      </p>
    </div>
  );
}
