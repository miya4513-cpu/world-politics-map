'use client';

import React from 'react';

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
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <a href={article.source_url} target="_blank" rel="noopener noreferrer">
      <div className="bg-gray-900 border border-slate-800 rounded-xl p-4 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer h-full flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            {article.source_name}
          </span>
          <span className="text-xs text-slate-500">{formattedDate}</span>
        </div>

        <h3 className="text-sm font-semibold text-white mb-3 flex-1 line-clamp-3 leading-relaxed">
          {article.title_ja}
        </h3>

        {relatedCountries.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {relatedCountries.slice(0, 3).map(country => (
              <span key={country.id} className="text-xs text-slate-400">
                {country.flag_emoji} {country.name_ja}
              </span>
            ))}
          </div>
        )}

        <div className="mt-2 text-xs text-slate-600 flex items-center gap-1">
          <span>外部サイトへ</span>
          <span>↗</span>
        </div>
      </div>
    </a>
  );
};

export default ArticleCard;
