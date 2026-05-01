'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getCountries, getCountryRelations, getPublishedArticles } from '@/lib/supabase';
import ArticleCard from '@/components/ArticleCard';
import Header from '@/components/Header';

const WorldMap = dynamic(() => import('@/components/WorldMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-gray-200 animate-pulse rounded-lg"></div>
});

interface Country {
  id: string;
  name_ja: string;
  name_en: string;
  flag_emoji: string;
  region: string;
  summary_ja: string;
  latitude: number;
  longitude: number;
}

interface CountryRelation {
  id: string;
  country_a: string;
  country_b: string;
  status: 'hostile' | 'tension' | 'friendly' | 'alliance';
  summary_ja: string;
  background_ja: string;
  last_updated: string;
}

interface Article {
  id: string;
  title_ja: string;
  source_name: string;
  source_url: string;
  published_at: string;
  related_countries: string[];
}

export default function HomePage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [relations, setRelations] = useState<CountryRelation[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [countriesData, relationsData, articlesData] = await Promise.all([
          getCountries(),
          getCountryRelations(),
          getPublishedArticles(5)
        ]);
        setCountries(countriesData);
        setRelations(relationsData);
        setArticles(articlesData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mt-20"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="home" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            世界政治情勢マップ
          </h1>
          <p className="text-gray-600 text-lg max-w-3xl mx-auto">
            複雑な国際関係をシンプルに可視化。
            国をクリックすると同盟・敵対関係が一目でわかります。
          </p>
        </section>

        <section className="mb-12">
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
            <div className="h-[500px]">
              <WorldMap 
                relations={relations}
                countries={countries}
                onCountrySelect={setSelectedCountry}
              />
            </div>
            
            {selectedCountry && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {countries.find(c => c.id === selectedCountry)?.flag_emoji}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {countries.find(c => c.id === selectedCountry)?.name_ja}
                      </h3>
                      <p className="text-sm text-gray-600">
                        クリックした国の関係が表示されています
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCountry(null)}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    選択を解除
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">最新の政治情勢ニュース</h2>
            <a href="/articles" className="text-blue-600 hover:text-blue-800 font-medium">
              すべて見る →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {articles.map((article) => (
              <ArticleCard 
                key={article.id} 
                article={article} 
                countries={countries} 
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600 text-sm">
            <p>世界政治情勢マップ © 2024</p>
            <p className="mt-2">データは随時更新されています</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
