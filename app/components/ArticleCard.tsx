'use client';

import React from 'react';
import Link from 'next/link';
import { getMediaIcon } from '@/lib/mediaIcons';

interface Country {
  id: string;
  name_ja: string;
  flag_emoji: string;
}

interface Article {
  id: string;
  title_ja: string;
  source_name: string;
  source_url: string;
  published_at: string;
  related_countries: string[];
}

interface ArticleCardProps {
  article: Article;
  countries: Country[];
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, countries }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRelatedCountries = () => {
    return article.related_countries
      .map(countryId => countries.find(c => c.id === countryId))
      .filter(Boolean) as Country[];
  };

  const relatedCountries = getRelatedCountries();

  return (
    <Link 
      href={`/articles/${article.id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden group"
    >
      <div className="p-4 h-full flex flex-col">
        {/* メディア情報 */}
        <div className="flex items-center space-x-2 mb-3">
          <span className="text-sm">{getMediaIcon(article.source_name)}</span>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
            {article.source_name}
          </span>
        </div>

        {/* 記事タイトル */}
        <h3 className="font-semibold text-gray-900 mb-3 line-clamp-3 leading-tight flex-grow group-hover:text-blue-600 transition-colors">
          {article.title_ja}
        </h3>

        {/* 関連国フラグ */}
        {relatedCountries.length > 0 && (
          <div className="flex items-center space-x-1 mb-3 flex-wrap">
            {relatedCountries.map((country) => (
              <span 
                key={country.id} 
                className="-lg hover:scale-110 transition-transform"
                title={country.name_ja}
              >
                {country.flag_emoji}
              </span>
            ))}
            <span className="text-xs text-gray-500 ml-1">
              ({relatedCountries.length}カ国)
            </span>
          </div>
        )}

        {/* 公開日時と閲覧リンク */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
          <span>{formatDate(article.published_at)}</span>
          <span className="text-blue-600 group-hover:text-blue-800 transition-colors">
            詳しく読む →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ArticleCard;
