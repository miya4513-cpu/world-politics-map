'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Article {
  id: string;
  title_ja: string;
  body_ja: string;
  source_name: string;
  source_url: string;
  published_at: string;
  related_countries: string[];
}

interface Country {
  id: string;
  name_ja: string;
  flag_emoji: string;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: a }, { data: c }] = await Promise.all([
        supabase.from('articles').select('*').eq('is_published', true).order('published_at', { ascending: false }).limit(50),
        supabase.from('countries').select('id, name_ja, flag_emoji')
      ]);
      setArticles(a || []);
      setCountries(c || []);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = articles.filter(a =>
    a.title_ja.toLowerCase().includes(search.toLowerCase()) ||
    (a.body_ja || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">ニュース記事一覧</h1>
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            地図に戻る
          </Link>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <input
            type="text"
            placeholder="記事を検索..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full p-3 bg-gray-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <p className="text-slate-400 mb-4 text-sm">{filtered.length}件の記事</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(article => {
            const related = countries.filter(c => article.related_countries?.includes(c.id));
            const date = new Date(article.published_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
            return (
              <a key={article.id} href={article.source_url} target="_blank" rel="noopener noreferrer">
                <div className="bg-gray-900 border border-slate-800 rounded-xl p-4 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all h-full flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">{article.source_name}</span>
                    <span className="text-xs text-slate-500">{date}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2 leading-relaxed">{article.title_ja}</h3>
                  {article.body_ja && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-3 flex-1">{article.body_ja}</p>
                  )}
                  {related.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-auto mb-2">
                      {related.slice(0, 3).map(c => (
                        <a key={c.id} href={`/countries/${c.id}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded-full transition-colors border border-slate-700">
                            <img src={`https://flagcdn.com/16x12/${c.id.toLowerCase()}.png`} alt={c.name_ja} className="w-4 h-3 object-cover rounded-sm" />
                            {c.name_ja}
                          </a>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-slate-600 flex items-center gap-1">
                    <span>外部サイトへ ↗</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </main>
    </div>
  );
}

