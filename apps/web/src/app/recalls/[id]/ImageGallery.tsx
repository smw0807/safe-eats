'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Props {
  imageUrls: string[];
  productName: string;
}

export default function ImageGallery({ imageUrls, productName }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  if (imageUrls.length === 0) return null;

  return (
    <>
      <div className="px-6 pt-6 flex gap-3 overflow-x-auto">
        {imageUrls.map((url, i) => (
          <button
            key={i}
            onClick={() => setSelected(url)}
            className="shrink-0 w-32 h-32 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 hover:ring-2 hover:ring-green-500 transition"
          >
            <Image
              src={url}
              alt={`${productName} 이미지 ${i + 1}`}
              width={128}
              height={128}
              className="w-full h-full object-contain"
              unoptimized
            />
          </button>
        ))}
      </div>

      {/* 확대 모달 */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setSelected(null)}
        >
          <div className="relative max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelected(null)}
              className="absolute -top-10 right-0 text-white text-sm hover:text-gray-300 transition"
            >
              닫기 ✕
            </button>
            <div className="bg-white rounded-xl overflow-hidden p-4 flex items-center justify-center">
              <Image
                src={selected}
                alt={productName}
                width={600}
                height={600}
                className="max-h-[80vh] w-auto object-contain"
                unoptimized
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
