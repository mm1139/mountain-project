import { pipeline } from '@xenova/transformers';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const generateEmbedding = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2'
  );
  const text = '伏見稲荷大社は千本鳥居で有名な京都の神社です。';
  const embedding = Array.from(
    (await generateEmbedding(text, { pooling: 'mean', normalize: true })).data
  );

  const { data, error } = await supabase.from('locations').insert([
    {
      title: '伏見稲荷大社',
      category: '神社',
      latitude: 34.9671,
      longitude: 135.7727,
      embedding,
      visit_dates: ['2025-04-01', '2025-04-10'],
      description: '千本鳥居で有名な京都の神社',
      image_urls: ['https://example.com/image1.jpg'],
    },
  ]);

  if (error) {
    console.error('DB登録エラー:', error.message);
  } else {
    console.log('登録成功:', data);
  }
}

main();
