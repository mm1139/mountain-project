import { NextRequest, NextResponse } from 'next/server';
import { pipeline } from '@xenova/transformers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const { title, text, latitude, longitude } = await req.json();

  // 埋め込み生成
  const generateEmbedding = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2'
  );
  const output = await generateEmbedding(text, {
    pooling: 'mean',
    normalize: true,
  });
  const embedding = Array.from(output.data); // 384次元配列

  // Supabaseに登録
  const { data, error } = await supabase.from('locations').insert([
    {
      title,
      category: '神社',
      latitude,
      longitude,
      embedding,
      description: text,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ data });
}
