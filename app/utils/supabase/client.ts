// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types'; // 必要に応じて型定義ファイルのパスを調整

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
