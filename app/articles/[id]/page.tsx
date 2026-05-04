'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getArticleById } from '@/lib/supabase';

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const data = await getArticleById(params.id as string);
      if (data && data.source_url) {
        window.location.href = data.source_url;
      } else {
        router.push('/articles');
      }
    }
    load();
  }, [params.id]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-slate-400">記事に移動中...</p>
      </div>
    </div>
  );
}
