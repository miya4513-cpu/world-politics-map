'use client';

import React from 'react';
import Link from 'next/link';

interface Article {
  id: string;
  title_ja: string;
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

interface ArticleCardProps {
  article: Article;
  countries: Country[];
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article, countries }) => {
  const relatedCountries = countries.filter(c =>
    article.related_countries?.includes(c.id)
  );

  const formattedDate = new Date(article.published_at).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Link href={`/articles/${article.id}`}>
      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {article.source_name}
          </span>
          <span className="text-xs text-gray-400">{formattedDate}</span>
        </div>

        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex-1 line-clamp-3">
          {article.title_ja}
        </h3>

        {relatedCountries.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {relatedCountries.slice(0, 3).map(country => (
              <span key={country.id} className="text-xs text-gray-600">
                {country.flag_emoji} {country.name_ja}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ArticleCard;
