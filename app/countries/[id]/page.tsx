'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '?';
  const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  epoch_id: string;
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

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  hostile: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', dot: '#f87171' },
  tension: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', dot: '#fb923c' },
  friendly: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', dot: '#4ade80' },
  alliance: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', dot: '#60a5fa' },
};

const REGION_LABELS: Record<string, string> = {
  'Asia': 'アジア',
  'Europe': 'ヨーロッパ',
  'Africa': 'アフリカ',
  'Americas': '南北アメリカ',
  'Oceania': 'オセアニア',
  'Middle East': '中東',
};

export default function CountryPage() {
  const params = useParams();
  const countryId = params?.id as string;

  const [country, setCountry] = useState<Country | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [relations, setRelations] = useState<CountryRelation[]>([]);
  const [epochs, setEpochs] = useState<Epoch[]>([]);
  const [selectedEpoch, setSelectedEpoch] = useState<string>('current');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [{ data: countriesData }, { data: epochData }, { data: relationsData }] = await Promise.all([
          supabase.from('countries').select('*'),
          supabase.from('epochs').select('*').order('sort_order'),
          supabase.from('country_relations').select('*').or(`country_a.eq.${countryId},country_b.eq.${countryId}`),
        ]);
        if (countriesData) {
          setCountries(countriesData);
          setCountry(countriesData.find((c: Country) => c.id === countryId) || null);
        }
        if (epochData) setEpochs(epochData);
        if (relationsData) setRelations(relationsData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    if (countryId) loadData();
  }, [countryId]);

  const filteredRelations = relations.filter(r => r.epoch_id === selectedEpoch);
  const currentEpoch = epochs.find(e => e.id === selectedEpoch);

  const statusCount = {
    hostile: relations.filter(r => r.status === 'hostile' && r.epoch_id === 'current').length,
    tension: relations.filter(r => r.status === 'tension' && r.epoch_id === 'current').length,
    friendly: relations.filter(r => r.status === 'friendly' && r.epoch_id === 'current').length,
    alliance: relations.filter(r => r.status === 'alliance' && r.epoch_id === 'current').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-center">
          <p className="text-2xl mb-4">国が見つかりません</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">← トップに戻る</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <span>←</span>
            <span className="text-sm">地図に戻る</span>
          </Link>
          <a href={`/?country=${countryId}`} className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors">🗺️ 地図で見る</a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-900 rounded-2xl border border-slate-800 p-8 mb-6">
          <div className="flex items-start gap-6">
            <img src={`https://flagcdn.com/48x36/${country.id.toLowerCase()}.png`} alt={country.name_ja} className="w-24 h-18 object-cover rounded-lg" />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-4xl font-bold text-white">{country.name_ja}</h1>
                <span className="text-slate-400 text-xl">{country.name_en}</span>
              </div>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-300 text-sm">
                  {REGION_LABELS[country.region] || country.region}
                </span>
                <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm">
                  現在{relations.filter(r => r.epoch_id === 'current').length}件の関係
                </span>
              </div>
              {country.summary_ja && (
                <p className="text-slate-300 leading-relaxed">{country.summary_ja}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {(['hostile', 'tension', 'friendly', 'alliance'] as const).map(status => (
              <div key={status} className={`rounded-xl p-3 border ${STATUS_COLORS[status].bg} ${STATUS_COLORS[status].border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status].dot }}></div>
                  <span className={`text-xs font-bold ${STATUS_COLORS[status].text}`}>{STATUS_LABELS[status]}</span>
                </div>
                <span className="text-2xl font-bold text-white">{statusCount[status]}</span>
                <span className="text-slate-400 text-xs">カ国</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-slate-800 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-white font-bold">時代別の関係を見る</h2>
          </div>
          <div className="px-6 py-4">
            <div className="flex flex-wrap gap-2">
              {epochs.map(epoch => {
                const count = relations.filter(r => r.epoch_id === epoch.id).length;
                const isSelected = selectedEpoch === epoch.id;
                return (
                  <button
                    key={epoch.id}
                    onClick={() => setSelectedEpoch(epoch.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                      isSelected
                        ? 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <span>{epoch.id === 'current' ? '🌐 現在' : `${epoch.year}年`}</span>
                    <span className="hidden sm:inline">{epoch.title_ja}</span>
                    {count > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${isSelected ? 'bg-blue-400/30' : 'bg-slate-700'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold">
                {currentEpoch?.id === 'current' ? '現在' : `${currentEpoch?.year}年`}の国際関係
              </h2>
              <p className="text-slate-400 text-sm mt-0.5">{currentEpoch?.title_ja} — {currentEpoch?.description_ja}</p>
            </div>
            <span className="text-slate-400 text-sm">{filteredRelations.length}件</span>
          </div>

          {filteredRelations.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              この時代のデータはまだありません
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {(['alliance', 'friendly', 'tension', 'hostile'] as const).map(status => {
                const rels = filteredRelations.filter(r => r.status === status);
                if (rels.length === 0) return null;
                return (
                  <div key={status} className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[status].dot }}></div>
                      <span className={`text-sm font-bold ${STATUS_COLORS[status].text}`}>{STATUS_LABELS[status]}（{rels.length}カ国）</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {rels.map(rel => {
                        const otherId = rel.country_a === countryId ? rel.country_b : rel.country_a;
                        const other = countries.find(c => c.id === otherId);
                        return (
                          <Link
                            key={rel.id}
                            href={`/countries/${otherId}`}
                            className={`rounded-xl p-4 border transition-all hover:scale-[1.01] cursor-pointer ${STATUS_COLORS[status].bg} ${STATUS_COLORS[status].border}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <img src={`https://flagcdn.com/24x18/${otherId.toLowerCase()}.png`} alt={otherId} className="w-6 h-4 object-cover rounded-sm inline-block" />
                                <span className="text-white font-medium">{other?.name_ja}</span>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${STATUS_COLORS[status].text} ${STATUS_COLORS[status].border}`}>
                                {STATUS_LABELS[status]}
                              </span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed">{rel.summary_ja}</p>
                            {rel.background_ja && (
                              <p className="text-slate-500 text-xs mt-2 leading-relaxed line-clamp-2">{rel.background_ja}</p>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gray-900 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 text-center text-slate-500 text-sm">
          <p>世界政治情勢マップ © 2024</p>
        </div>
      </footer>
    </div>
  );
}
