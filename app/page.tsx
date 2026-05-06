'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { getCountries, getPublishedArticles } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import ArticleCard from '@/components/ArticleCard';
import Header from '@/components/Header';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  body_ja: string;
  source_name: string;
  source_url: string;
  published_at: string;
  related_countries: string[];
}

interface Epoch {
  id: string;
  year: number;
  title_ja: string;
  description_ja: string;
  sort_order: number;
}

const STATUS_LABELS: Record<string, string> = {
  hostile: '敵対',
  tension: '対立',
  friendly: '友好',
  alliance: '同盟',
};
const STATUS_COLORS: Record<string, string> = {
  hostile: 'text-red-400 bg-red-500/10 border-red-500/30',
  tension: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  friendly: 'text-green-400 bg-green-500/10 border-green-500/30',
  alliance: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
};

const COUNTRY_GROUPS = [
  {
    id: 'eu',
    label: 'EU',
    emoji: '🇪🇺',
    color: '#60a5fa',
    members: ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'],
  },
  {
    id: 'nato',
    label: 'NATO',
    emoji: '🛡️',
    color: '#34d399',
    members: ['AL','BE','CA','HR','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IT','LV','LT','LU','ME','NL','MK','NO','PL','PT','RO','SK','SI','ES','TR','GB','US'],
  },
  {
    id: 'asean',
    label: 'ASEAN',
    emoji: '🌏',
    color: '#fbbf24',
    members: ['BN','KH','ID','LA','MY','MM','PH','SG','TH','VN'],
  },
  {
    id: 'g7',
    label: 'G7',
    emoji: '🏦',
    color: '#f472b6',
    members: ['CA','FR','DE','IT','JP','GB','US'],
  },
  {
    id: 'brics',
    label: 'BRICs',
    emoji: '🌐',
    color: '#fb923c',
    members: ['BR','RU','IN','CN','ZA','ET','EG','IR','SA','AE'],
  },
  {
    id: 'arab',
    label: 'アラブ連盟',
    emoji: '🕌',
    color: '#a78bfa',
    members: ['DZ','BH','KM','DJ','EG','IQ','JO','KW','LB','LY','MR','MA','OM','PS','QA','SA','SO','SD','SY','TN','AE','YE'],
  },
];

export default function HomePage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [relations, setRelations] = useState<CountryRelation[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [epochs, setEpochs] = useState<Epoch[]>([]);
  const [selectedEpoch, setSelectedEpoch] = useState<string>('current');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

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
    setSelectedGroup(null);
    await loadRelations(epochId);
  }

  function handleGroupClick(groupId: string) {
    if (selectedGroup === groupId) {
      setSelectedGroup(null);
    } else {
      setSelectedGroup(groupId);
      setSelectedCountry(null);
    }
  }

  const currentEpoch = epochs.find(e => e.id === selectedEpoch);
  const activeGroup = COUNTRY_GROUPS.find(g => g.id === selectedGroup);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const selectedCountryData = countries.find(c => c.id === selectedCountry);
  const selectedRelations = relations.filter(
    r => r.country_a === selectedCountry || r.country_b === selectedCountry
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <Header
        currentPage="home"
        countries={countries}
        onCountrySelect={(id) => { setSelectedCountry(id); setSelectedGroup(null); }}
      />

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
            <div className="px-6 py-5">
              <div className="relative">
                <div className="absolute top-4 left-0 right-0 h-0.5 bg-slate-700"></div>
                <div className="relative flex justify-between items-start overflow-x-auto pb-2">
                  {epochs.map((epoch) => {
                    const isSelected = selectedEpoch === epoch.id;
                    const isCurrent = epoch.id === 'current';
                    return (
                      <button
                        key={epoch.id}
                        onClick={() => handleEpochChange(epoch.id)}
                        className="flex flex-col items-center group flex-shrink-0 px-2"
                        style={{ minWidth: `${100 / epochs.length}%` }}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 mb-2 z-10 ${
                          isSelected
                            ? 'bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/50 scale-125'
                            : 'bg-slate-800 border-slate-600 group-hover:border-blue-500'
                        }`}></div>
                        <span className={`text-xs font-bold mb-1 transition-colors ${
                          isSelected ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                        }`}>
                          {isCurrent ? '現在' : epoch.year}
                        </span>
                        <span className={`text-xs text-center leading-tight max-w-16 ${
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

        {/* 地図 + グループボタン + 関係一覧 */}
        <section className="mb-8">
          {/* グループボタン */}
          <div className="flex flex-wrap gap-2 mb-3">
            {COUNTRY_GROUPS.map(group => {
              const isActive = selectedGroup === group.id;
              return (
                <button
                  key={group.id}
                  onClick={() => handleGroupClick(group.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border transition-all duration-200 ${
                    isActive
                      ? 'text-white border-transparent scale-105 shadow-lg'
                      : 'text-slate-300 bg-slate-800 border-slate-600 hover:border-slate-400'
                  }`}
                  style={isActive ? { backgroundColor: group.color, borderColor: group.color, boxShadow: `0 0 12px ${group.color}60` } : {}}
                >
                  <span>{group.emoji}</span>
                  <span>{group.label}</span>
                  {isActive && <span className="text-xs opacity-80">({group.members.length}カ国)</span>}
                </button>
              );
            })}
            {selectedGroup && (
              <button
                onClick={() => setSelectedGroup(null)}
                className="px-3 py-1.5 rounded-full text-xs text-slate-400 border border-slate-600 hover:text-white hover:border-slate-400 transition-all"
              >
                ✕ 解除
              </button>
            )}
          </div>

          <div className="bg-gray-900 rounded-2xl border border-slate-800 p-4">
            <div className="h-[500px]">
              <WorldMap
                relations={relations}
                countries={countries}
                onCountrySelect={(id) => { setSelectedCountry(id); setSelectedGroup(null); }}
                selectedCountryId={selectedCountry}
                highlightCountries={activeGroup ? activeGroup.members : null}
                highlightColor={activeGroup ? activeGroup.color : undefined}
              />
            </div>

            {/* グループ情報バー */}
            {selectedGroup && activeGroup && (
              <div className="mt-4 rounded-xl border overflow-hidden" style={{ borderColor: `${activeGroup.color}40`, backgroundColor: `${activeGroup.color}10` }}>
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{activeGroup.emoji}</span>
                    <div>
                      <h3 className="font-bold text-white">{activeGroup.label}</h3>
                      <p className="text-xs text-slate-400">加盟国 {activeGroup.members.length}カ国</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className="text-slate-400 hover:text-white text-sm px-3 py-1 rounded-lg hover:bg-slate-700"
                  >
                    ✕ 解除
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 px-4 pb-4">
                  {activeGroup.members.map(memberId => {
                    const c = countries.find(x => x.id === memberId);
                    if (!c) return null;
                    return (
                      <button
                        key={memberId}
                        onClick={() => { setSelectedCountry(memberId); setSelectedGroup(null); }}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-white transition-all"
                      >
                        <span>{c.flag_emoji}</span>
                        <span>{c.name_ja}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 国選択の関係一覧 */}
            {selectedCountry && selectedCountryData && (
              <div className="mt-4 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedCountryData.flag_emoji}</span>
                    <div>
                      <h3 className="font-bold text-white">{selectedCountryData.name_ja}</h3>
                      <p className="text-xs text-slate-400">{selectedRelations.length}件の関係</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedCountry(null)}
                    className="text-slate-400 hover:text-white text-sm px-3 py-1 rounded-lg hover:bg-slate-700"
                  >
                    ✕ 解除
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                  {selectedRelations.map(rel => {
                    const otherId = rel.country_a === selectedCountry ? rel.country_b : rel.country_a;
                    const other = countries.find(c => c.id === otherId);
                    return (
                      <div key={rel.id} className="bg-slate-900 rounded-lg p-3 border border-slate-700">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span>{other?.flag_emoji}</span>
                            <span className="text-white text-sm font-medium">{other?.name_ja}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${STATUS_COLORS[rel.status]}`}>
                            {STATUS_LABELS[rel.status]}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{rel.summary_ja}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ニュース */}
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
          </div>
        </div>
      </footer>
    </div>
  );
}
