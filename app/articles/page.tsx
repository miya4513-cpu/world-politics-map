'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPublishedArticles, getMediaSources, getCountries } from '@/lib/supabase';
import { REGIONS } from '@/lib/constants';
import ArticleCard from '@/components/ArticleCard';

interface Article {
  id: string;
  title_ja: string;
  title_original: string;
  body_ja: string;
  source_name: string;
  source_url: string;
  source_country: string;
  published_at: string;
  is_published: boolean;
  related_countries: string[];
}

interface MediaSource {
  id: string;
  name: string;
  country: string;
  is_active: boolean;
}

interface Country {
  id: string;
  name_ja: string;
  flag_emoji: string;
}

export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [mediaSources, setMediaSources] = useState<MediaSource[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ region: '', media: '', search: '' });
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [articlesData, mediaData, countriesData] = await Promise.all([
          getPublishedArticles(50),
          getMediaSources(),
          getCountries()
        ]);
        setArticles(articlesData);
        setFilteredArticles(articlesData);
        setMediaSources(mediaData);
        setCountries(countriesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    let filtered = articles;
    if (filters.region) {
      filtered = filtered.filter(article => {
        const articleCountries = article.related_countries
          .map(id => countries.find(c => c.id === id))
          .filter(Boolean) as Country[];
        return articleCountries.some(c => getRegionFromCountry(c.id) === filters.region);
      });
    }
    if (filters.media) {
      filtered = filtered.filter(a => a.source_name === filters.media);
    }
    if (filters.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(a =>
        a.title_ja.toLowerCase().includes(s) || a.body_ja.toLowerCase().includes(s)
      );
    }
    const sorted = [...filtered].sort((a, b) => {
      const da = new Date(a.published_at).getTime();
      const db = new Date(b.published_at).getTime();
      return sortBy === 'newest' ? db - da : da - db;
    });
    setFilteredArticles(sorted);
    setCurrentPage(1);
  }, [filters, articles, countries, sortBy]);

  const getRegionFromCountry = (countryId: string): string => {
    const regionMap: { [key: string]: string } = {
      'JP': '東アジア', 'CN': '東アジア', 'KR': '東アジア', 'TW': '東アジア', 'KP': '東アジア',
      'US': '北米', 'CA': '北米',
      'GB': '西欧', 'FR': '西欧', 'DE': '西欧', 'IT': '西欧',
      'RU': '東欧', 'UA': '東欧',
      'IL': '中東', 'IR': '中東', 'SA': '中東', 'PS': '中東',
      'IN': '南アジア', 'PK': '南アジア',
      'AU': 'オセアニア', 'NZ': 'オセアニア',
    };
    return regionMap[countryId] || 'その他';
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const totalPages = Math.ceil(filteredArticles.length / itemsPerPage);
  const paginatedArticles = filteredArticles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ニュース記事一覧</h1>
            <p className="text-gray-600">世界中の政治情勢に関する最新ニュース</p>
          </div>
          <Link href="/" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            地図に戻る
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">地域</label>
              <select
                value={filters.region}
                onChange={(e) => handleFilterChange('region', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">すべての地域</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">メディア</label>
              <select
                value={filters.media}
                onChange={(e) => handleFilterChange('media', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">すべてのメディア</option>
                {mediaSources.filter(s => s.is_active).map(s => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">キーワード</label>
              <input
                type="text"
                placeholder="記事を検索..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">並び替え</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
                className="w-full p-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="newest">新しい順</option>
                <option value="oldest">古い順</option>
              </select>
            </div>
          </div>
        </div>

        <p className="text-gray-600 mb-6">{filteredArticles.length}件の記事</p>

        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedArticles.map(article => (
              <ArticleCard key={article.id} article={article} countries={countries} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📰</div>
            <p>記事が見つかりませんでした</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center space-x-2 mt-8">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
            >前へ</button>
            <span className="px-3 py-1 text-sm">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
            >次へ</button>
          </div>
        )}
      </main>
    </div>
  );
}
