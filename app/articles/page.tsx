'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getArticleById, getCountries, supabase } from '@/lib/supabase';
import { getMediaIcon } from '@/lib/mediaIcons';
import { formatDateTimeJa } from '@/lib/utils';
import Header from '@/components/Header';
import CountryTags from '@/components/CountryTags';
import ShareButtons from '@/components/ShareButtons';
import ArticleActions from '@/components/ArticleActions';

interface Article {
  id: string;
  title_ja: string;
  title_original: string;
  body_ja: string;
  source_name: string;
  source_url: string;
  source_country: string;
  published_at: string;
  related_countries: string[];
}

interface Country {
  id: string;
  name_ja: string;
  flag_emoji: string;
  region: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [article, setArticle] = useState<Article | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        
        const articleId = params.id as string;
        const [articleData, countriesData] = await Promise.all([
          getArticleById(articleId),
          getCountries()
        ]);

        if (!articleData) {
          setError('記事が見つかりませんでした');
          return;
        }

        setArticle(articleData);
        setCountries(countriesData);

        // 関連記事の読み込み
        if (articleData.related_countries.length > 0) {
          const { data } = await supabase
            .from('articles')
            .select('*')
            .eq('is_published', true)
            .neq('id', articleId)
            .overlaps('related_countries', articleData.related_countries)
            .order('published_at', { ascending: false })
            .limit(3);

          if (data) setRelatedArticles(data);
        }
      } catch (error) {
        console.error('Error loading article:', error);
        setError('記事の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      loadData();
    }
  }, [params.id]);

  const getRelatedCountries = () => {
    if (!article) return [];
    return article.related_countries
      .map(countryId => countries.find(c => c.id === countryId))
      .filter(Boolean) as Country[];
  };

  const handleViewRelations = () => {
    if (article && article.related_countries.length > 0) {
      router.push(`/?country=${article.related_countries[0]}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currentPage="article" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mt-20"></div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currentPage="article" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📰</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{error || '記事が見つかりませんでした'}</h2>
            <p className="text-gray-600 mb-8">
              指定された記事は存在しないか、削除された可能性があります。
            </p>
            <div className="flex justify-center space-x-4">
              <Link
                href="/articles"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                記事一覧に戻る
              </Link>
              <Link
                href="/"
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ホームに戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const relatedCountries = getRelatedCountries();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="article" />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ナビゲーション */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-gray-900 transition-colors">
            ホーム
          </Link>
          <span>/</span>
          <Link href="/articles" className="hover:text-gray-900 transition-colors">
            記事一覧
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">
            {article.title_ja.substring(0, 20) + '...'}
          </span>
        </nav>

        {/* 記事ヘッダー */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          {/* メディア情報とアクション */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getMediaIcon(article.source_name)}</span>
              <div>
                <div className="bg-blue- text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {article.source_name}
                </div>
                {article.source_country && (
                  <div className="text-xs text-gray-500 mt-1">
                    発信元: {countries.find(c => c.id === article.source_country)?.name_ja || article.source_country}
                  </div>
                )}
              </div>
            </div>
            
            <ArticleActions
              title={article.title_ja}
              url={currentUrl}
              sourceUrl={article.source_url}
            />
          </div>

          {/* 公開日時 */}
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
            <span>{formatDateTimeJa(article.published_at)}</span>
            <span>•</span>
            <span>読了目安: {Math.ceil(article.body_ja.length / 400)}分</span>
          </div>

          {/* 記事タイトル */}
          <h1 className="text-3xl font-bold text-gray-900 mb-6 leading-tight">
            {article.title_ja}
          </h1>

          {/* 原文タイトル */}
          {article.title_original && (
            <div className="text-gray-600 text-sm mb-6 italic border-l-4 border-gray-200 pl-4 py-2">
              Original: "{article.title_original}"
            </div>
          )}

          {/* 関連国 */}
          {relatedCountries.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">関連国</h3>
              <CountryTags countries={relatedCountries} />
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex flex-wrap gap-3 items-center pt-4 border-t border-gray-200">
            <button
              onClick={handleViewRelations}
              disabled={relatedCountries.length === 0}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              この国の関係を見る
            </button>
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center space-x-2"
            >
              <span>原文を読む</span>
              <span>↗</span>
            </a>
            <ShareButtons title={article.title_ja} url={currentUrl} />
          </div>
        </div>

                {/* 記事本文 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">記事本文</h2>
          <div className="prose max-w-none text-gray-800 leading-relaxed">
            {article.body_ja.split('\n').map((paragraph, index) => (
              paragraph.trim() && (
                <p key={index} className="mb-6 text-justify">
                  {paragraph}
                </p>
              )
            ))}
          </div>
        </div>

        {/* メタ情報 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">記事情報</h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="font-medium text-gray-700">メディア</dt>
              <dd className="text-gray-600">{article.source_name}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">公開日時</dt>
              <dd className="text-gray-600">{formatDateTimeJa(article.published_at)}</dd>
            </div>
            <div>
              <dt className="font-medium text-gray-700">原文URL</dt>
              <dd className="text-gray-600 break-all">
                <a
                  href={article.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {article.source_url}
                </a>
              </dd>
            </div>
            {article.source_country && (
              <div>
                <dt className="font-medium text-gray-700">発信国</dt>
                <dd className="text-gray-600">
                  {countries.find(c => c.id === article.source_country)?.name_ja || article.source_country}
                </dd>
              </div>
            )}
            <div className="md:col-span-2">
              <dt className="font-medium text-gray-700">関連国</dt>
              <dd className="text-gray-600">
                {relatedCountries.map(country => country.name_ja).join(', ')}
              </dd>
            </div>
          </dl>
        </div>

        {/* 関連記事セクション */}
        {relatedArticles.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">関連記事</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <Link
                  key={relatedArticle.id}
                  href={`/articles/${relatedArticle.id}`}
                  className="block bg-gray-50 hover:bg-gray-100 rounded-lg p-4 transition-colors group"
                >
                  <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full mb-3 inline-block">
                    {relatedArticle.source_name}
                  </div>
                  <h4 className="font-medium text-gray-900 mb-2 group-hover:text-blue-600 line-clamp-2">
                    {relatedArticle.title_ja}
                  </h4>
                  <div className="text-sm text-gray-600">
                    {new Date(relatedArticle.published_at).toLocaleDateString('ja-JP')}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getCountryById, getCountryRelationsByCountry, getCountryArticles, getCountriesByRegion } from '@/lib/supabase';
import { RELATION_STATUS, REGION_COLORS } from '@/lib/constants';
import ArticleCard from '@/components/ArticleCard';

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

export default function CountryPage() {
  const params = useParams();
  const router = useRouter();
  const [country, setCountry] = useState<Country | null>(null);
  const [relations, setRelations] = useState<CountryRelation[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [regionCountries, setRegionCountries] = useState<Country[]>([]);
  const [allCountries, setAllCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'status' | 'date'>('status');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const countryId = params.id as string;
        const [countryData, relationsData, articlesData, countriesData] = await Promise.all([
          getCountryById(countryId),
          getCountryRelationsByCountry(countryId),
          getCountryArticles(countryId),
          getCountriesByRegion('')
        ]);
        if (!countryData) {
          setError('国が見つかりませんでした');
          return;
        }
        setCountry(countryData);
        setRelations(relationsData);
        setArticles(articlesData);
        setAllCountries(countriesData);
        if (countryData.region) {
          const regionCountriesData = await getCountriesByRegion(countryData.region);
          setRegionCountries(regionCountriesData.filter((c: Country) => c.id !== countryId));
        }
      } catch (error) {
        console.error('Error loading country data:', error);
        setError('データの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    }
    if (params.id) loadData();
  }, [params.id]);

  const getRelatedCountry = (relation: CountryRelation): Country => {
    const otherCountryId = relation.country_a === country?.id ? relation.country_b : relation.country_a;
    return allCountries.find(c => c.id === otherCountryId)!;
  };

  const getStatusRelations = (status: string) => relations.filter(r => r.status === status);

  const getSortedRelations = () => {
    const filtered = selectedStatus === 'all' ? relations : relations.filter(r => r.status === selectedStatus);
    if (sortBy === 'date') {
      return [...filtered].sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime());
    }
    const order = ['hostile', 'tension', 'friendly', 'alliance'];
    return [...filtered].sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('ja-JP');

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  if (error || !country) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🏳️</div>
        <h2 className="text-2xl font-bold mb-4">国が見つかりませんでした</h2>
        <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg">地図に戻る</Link>
      </div>
    </div>
  );

  const sortedRelations = getSortedRelations();
  const lastUpdated = relations.length > 0 ? new Date(Math.max(...relations.map(r => new Date(r.last_updated).getTime()))) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-blue-600 hover:text-blue-800 text-sm">← ホームに戻る</Link>
              <h1 className="text-2xl font-bold flex items-center space-x-2">
                <span className="text-4xl">{country.flag_emoji}</span>
                <span>{country.name_ja}</span>
              </h1>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${REGION_COLORS[country.region] || 'bg-gray-100 text-gray-800'}`}>
              {country.region}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <p className="text-gray-700 leading-relaxed">{country.summary_ja}</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">国際関係</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(RELATION_STATUS).map(([status, data]) => (
              <div key={status} className="p-4 rounded-lg border-2 bg-gray-50 border-gray-200 text-center">
                <div className="text-2xl font-bold" style={{ color: data.color }}>{getStatusRelations(status).length}</div>
                <div className="text-sm text-gray-600">{data.label}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedRelations.map(relation => {
              const other = getRelatedCountry(relation);
              const statusData = RELATION_STATUS[relation.status];
              return (
                <div key={relation.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{other?.flag_emoji}</span>
                      <Link href={`/countries/${other?.id}`} className="font-semibold hover:text-blue-600">{other?.name_ja}</Link>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${statusData.color}20`, color: statusData.color }}>{statusData.label}</span>
                  </div>
                  <p className="text-sm text-gray-700">{relation.summary_ja}</p>
                  <div className="mt-2 text-xs text-gray-500">更新: {formatDate(relation.last_updated)}</div>
                </div>
              );
            })}
          </div>
        </div>

        {articles.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">関連記事</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {articles.slice(0, 6).map(article => (
                <ArticleCard key={article.id} article={article} countries={allCountries} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}