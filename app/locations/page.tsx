'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

//場所の型定義
type Location = {
  id: number;
  title: string;
  category: string;
  image_url: string[];
  latitude: number;
  longitude: number;
  visit_dates: string[];
  description: string;
  created_at: string;
  updated_at: string;
};

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  //データ取得
  useEffect(() => {
    const fetchLocations = async () => {
      setLoading(true);
      let query = supabase.from('locations').select('*');
      if (category !== 'all') {
        query = query.eq('category', category);
      }
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;

      if (error) {
        console.error('Error fetching locations:', error);
        setError(error.message);
      } else {
        setLocations(data || []);
      }
      setLoading(false);
    };

    fetchLocations();
  }, [category]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">場所一覧</h1>
        <Link
          href="/locations/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded">
          新規登録
        </Link>
      </div>

      {/* カテゴリフィルター */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setCategory('all')}
            className={`px-4 py-2 rounded ${
              category === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
            }`}>
            すべて
          </button>
          <button
            onClick={() => setCategory('神社')}
            className={`px-4 py-2 rounded ${
              category === '神社' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
            }`}>
            神社
          </button>
          <button
            onClick={() => setCategory('山')}
            className={`px-4 py-2 rounded ${
              category === '山' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
            }`}>
            山
          </button>
          <button
            onClick={() => setCategory('観光')}
            className={`px-4 py-2 rounded ${
              category === '観光' ? 'bg-indigo-600 text-white' : 'bg-gray-200'
            }`}>
            観光
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="spinner"></div>
          <p>読み込み中...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <Link key={location.id} href={`/locations/${location.id}`}>
              <div className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                {location.image_urls && location.image_urls[0] && (
                  <div className="relative h-48 w-full">
                    <Image
                      src={location.image_urls[0]}
                      alt={location.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">
                    {location.category}
                  </span>
                  <h2 className="text-xl font-semibold">{location.title}</h2>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
