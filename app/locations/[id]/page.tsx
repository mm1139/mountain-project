'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアント
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 場所の型定義
type Location = {
  id: number;
  title: string;
  category: string;
  description: string;
  image_urls: string[];
  latitude: number;
  longitude: number;
  visit_dates: string[];
};

export default function LocationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    async function fetchLocation() {
      setLoading(true);
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) {
        console.error('Error fetching location:', error);
        router.push('/');
      } else {
        setLocation(data);
      }
      setLoading(false);
    }

    fetchLocation();
  }, [params.id, router]);

  const handleDelete = async () => {
    if (!confirm('本当に削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', params.id);

      if (error) throw error;

      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Error deleting location:', error);
      alert('削除中にエラーが発生しました。');
    }
  };

  const nextImage = () => {
    if (
      location?.image_urls &&
      currentImageIndex < location.image_urls.length - 1
    ) {
      setCurrentImageIndex((prev) => prev + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex((prev) => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="spinner"></div>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="text-center py-10">場所が見つかりませんでした。</div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/" className="text-indigo-600 hover:text-indigo-800">
          ← 一覧に戻る
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* 画像スライダー */}
        {location.image_urls && location.image_urls.length > 0 && (
          <div className="relative h-96 w-full">
            <Image
              src={location.image_urls[currentImageIndex]}
              alt={location.title}
              fill
              className="object-cover"
            />

            {location.image_urls.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  disabled={currentImageIndex === 0}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full">
                  ←
                </button>
                <button
                  onClick={nextImage}
                  disabled={
                    currentImageIndex === location.image_urls.length - 1
                  }
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full">
                  →
                </button>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                  {location.image_urls.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`h-2 w-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                {location.category}
              </span>
              <h1 className="text-3xl font-bold text-gray-800">
                {location.title}
              </h1>
            </div>

            <div className="flex space-x-2">
              <Link
                href={`/locations/${params.id}/edit`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">
                編集
              </Link>
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
                削除
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">詳細</h2>
            <p className="text-gray-700 whitespace-pre-line">
              {location.description}
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">位置情報</h2>
            <p className="text-gray-700">緯度: {location.latitude}</p>
            <p className="text-gray-700">経度: {location.longitude}</p>

            {/* Google Mapを埋め込む場合 */}
            <div className="mt-4 h-64 w-full">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${location.latitude},${location.longitude}`}
                allowFullScreen></iframe>
            </div>
          </div>

          {location.visit_dates && location.visit_dates.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">訪問日</h2>
              <div className="flex flex-wrap gap-2">
                {location.visit_dates.map((date, index) => (
                  <span
                    key={index}
                    className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">
                    {date}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
