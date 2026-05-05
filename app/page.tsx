'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { getCountries, getPublishedArticles } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import ArticleCard from '@/components/ArticleCard';
import Header from '@/components/Header';

const WorldMap = dynamic(() => import('@/components/WorldMap'), {
  ssr: false,
  loading: () => <div className="w-full h-[500px] bg-gray-800 animate-pulse rounded-lg"></div>
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
  conflict_types?: string[];
  epoch_id?: string;
}

interface Article {
  id: string;
  title_ja: string;
  source_name: string;
  source_url: string;
  published_at: string;
  body_ja: string;
  related_countries: string[];
}

interface Epoch {
  id: string;
  year: number;
  title_ja: string;
  description_ja: string;
  sort_order: number;
}

export default function HomePage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [relations, setRelations] = useState<CountryRelation[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [epochs, setEpochs] = useState<Epoch[]>([]);
  const [selectedEpoch, setSelectedEpoch] = useState<string>('current');
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [countriesData, articlesData] = await Promise.all([
          getCountries(),
          getPublishedArticles(5)
        ]);
        setCountries(countriesData);
        setArticles(articlesData);

        const { data: epochData } = await supabase
          .from('epochs')
          .select('*')
          .order('sort_order');
        if (epochData) setEpochs(epochData);

        await loadRelations('current');
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function loadRelations(epochId: string) {
    const { data } = await supabase
      .from('country_relations')
      .select('*')
      .eq('epoch_id', epochId);
    if (data) setRelations(data);
  }

  async function handleEpochChange(epochId: string) {
    setSelectedEpoch(epochId);
    setSelectedCountry(null);
    await loadRelations(epochId);
  }

  const currentEpoch = epochs.find(e => e.id === selectedEpoch);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header currentPage="home" />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">世界政治情勢マップ</h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto">
            複雑な国際関係をシンプルに可視化。国をクリックすると同盟・敵対関係が一目でわかります。
          </p>
        </section>

        {/* タイムライン */}
        <section className="mb-6">
          <div className="bg-gray-900 rounded-2xl border border-slate-800 overflow-hidden">
            
            {/* 選択中エポックの情報 */}
            <div className="px-6 py-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                {currentEpoch ? (
                  <>
                    <span className="text-blue-400 font-bold text-lg">
                      {currentEpoch.id === 'current' ? '現在' : `${currentEpoch.year}年`}
                    </span>
                    <span className="text-white font-semibold">{currentEpoch.title_ja}</span>
                    <span className="text-slate-400 text-sm">— {currentEpoch.description_ja}</span>
                  </>
                ) : (
                  <span className="text-slate-400">時代を選択してください</span>
                )}
              </div>
            </div>

            {/* タイムラインバー */}
            <div className="px-6 py-5" ref={timelineRef}>
              <div className="relative">
                {/* 横線 */}
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-700"></div>
                
                {/* エポックボタン */}
                <div className="relative flex justify-between items-start overflow-x-auto pb-2">
                  {epochs.map((epoch, index) => {
                    const isSelected = selectedEpoch === epoch.id;
                    const isCurrent = epoch.id === 'current';
                    return (
                      <button
                        key={epoch.id}
                        onClick={() => handleEpochChange(epoch.id)}
                        className="flex flex-col items-center group flex-shrink-0 px-2"
                        style={{ minWidth: `${100 / epochs.length}%` }}
                      >
                        {/* ドット */}
                        <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 mb-2 z-10 ${
                          isSelected
                            ? 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50 scale-125'
                            : 'bg-slate-800 border-slate-600 group-hover:border-blue-500 group-hover:bg-slate-700'
                        }`}></div>
                        
                        {/* 年 */}
                        <span className={`text-xs font-bold mb-1 transition-colors ${
                          isSelected ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}>
                          {isCurrent ? '現在' : epoch.year}
                        </span>
                        
                        {/* タイトル */}
                        <span className={`text-xs text-center leading-tight transition-colors max-w-16 ${
                          isSelected ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'
                        }`}>
                          {isCurrent ? '🌐' : epoch.title_ja.length > 8 ? epoch.title_ja.slice(0, 8) + '…' : epoch.title_ja}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 世界地図 */}
        <section className="mb-8">
          <div className="bg-gray-900 rounded-2xl border border-slate-800 p-4 flex gap-4">
            {/* 地図 */}
            <div className="flex-1 h-[500px]">
              <WorldMap 
                relations={relations}
                countries={countries}
                onCountrySelect={setSelectedCountry}
              />
            </div>

            {/* サイドパネル */}
            <div className="w-64 flex flex-col bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex-shrink-0">
              <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                {selectedCountry ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{countries.find(c => c.id === selectedCountry)?.flag_emoji}</span>
                      <span className="font-semibold text-white text-sm">{countries.find(c => c.id === selectedCountry)?.name_ja}</span>
                    </div>
                    <button onClick={() => setSelectedCountry(null)} className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded hover:bg-slate-700">✕</button>
                  </>
                ) : (
                  <span className="text-slate-400 text-sm">国をクリックしてください</span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {selectedCountry ? (
                  relations
                    .filter(r => r.country_a === selectedCountry || r.country_b === selectedCountry)
                    .map(rel => {
                      const otherId = rel.country_a === selectedCountry ? rel.country_b : rel.country_a;
                      const other = countries.find(c => c.id === otherId);
                      const statusColors: Record<string, string> = {
                        hostile: 'text-red-400 bg-red-400/10',
                        tension: 'text-orange-400 bg-orange-400/10',
                        friendly: 'text-green-400 bg-green-400/10',
                        alliance: 'text-blue-400 bg-blue-400/10',
                      };
                      const statusLabels: Record<string, string> = {
                        hostile: '敵対', tension: '対立', friendly: '友好', alliance: '同盟'
                      };
                      if (!other) return null;
                      return (
                        <div key={rel.id} className="border-b border-slate-700 pb-3 last:border-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base">{other.flag_emoji}</span>
                            <span className="text-white text-xs font-medium">{other.name_ja}</span>
                            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${statusColors[rel.status]}`}>
                              {statusLabels[rel.status]}
                            </span>
                          </div>
                          <p className="text-slate-400 text-xs leading-relaxed">{rel.summary_ja}</p>
                        </div>
                      );
                    })
                ) : (
                  <p className="text-slate-500 text-xs text-center mt-8">地図上の国をクリックすると<br/>関係一覧が表示されます</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 最新記事 */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">最新の政治情勢ニュース</h2>
            <a href="/articles" className="text-blue-400 hover:text-blue-300 font-medium">すべて見る →</a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} countries={countries} />
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-500 text-sm">
            <p>世界政治情勢マップ © 2024</p>
            <p className="mt-2">データは随時更新されています</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
