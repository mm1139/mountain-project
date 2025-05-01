'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Location = {
  id: number;
  title: string;
  category: string;
  image_urls: string[];
  description: string;
};

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);

    try {
      // 1. クエリテキストから埋め込みを生成
      const extractor = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
      );
      const output = await extractor(query, {
        pooling: 'mean',
        normalize: true,
      });
      const embedding = Array.from(output.data);

      // 2. Supabaseでベクトル検索
      const { data, error } = await supabase.rpc('match_locations', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 10,
      });

      if (error) throw error;

      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      alert('検索中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">検索</h1>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="キーワードを入力..."
            className="shadow appearance-none border rounded-l w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-r"
            disabled={loading}>
            {loading ? '検索中...' : '検索'}
          </button>
        </div>
      </form>

      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((location) => (
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
                  <p className="text-gray-700 mt-2 line-clamp-3">
                    {location.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        query &&
        !loading && <p className="text-center py-10">検索結果がありません。</p>
      )}
    </div>
  );
}
