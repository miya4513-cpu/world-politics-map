import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const COUNTRY_KEYWORDS: Record<string, string[]> = {
  US: ['アメリカ', '米国', 'トランプ', 'ワシントン'],
  CN: ['中国', '習近平', '北京'],
  RU: ['ロシア', 'プーチン', 'モスクワ'],
  UA: ['ウクライナ', 'キーウ'],
  JP: ['日本', '東京', '岸田', '石破'],
  KP: ['北朝鮮', '金正恩'],
  IL: ['イスラエル', 'ネタニヤフ'],
  PS: ['パレスチナ', 'ガザ', 'ハマス'],
  TW: ['台湾', '台北'],
  KR: ['韓国', 'ソウル'],
  IN: ['インド', 'モディ'],
  IR: ['イラン', 'テヘラン'],
  SA: ['サウジアラビア'],
  DE: ['ドイツ', 'ベルリン'],
  FR: ['フランス', 'パリ'],
  GB: ['イギリス', 'ロンドン'],
};

export async function GET() {
  try {
    const apiKey = process.env.NEWSAPI_KEY;
    const url = `https://newsapi.org/v2/everything?q=国際政治 OR 外交 OR 安全保障 OR 戦争 OR 制裁&language=jp&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'ok' || !data.articles) {
      return NextResponse.json({ error: data.message || 'No articles' }, { status: 400 });
    }

    let inserted = 0;
    for (const article of data.articles) {
      if (!article.title || article.title === '[Removed]') continue;

      const title = article.title;
      const relatedCountries: string[] = [];

      for (const [countryId, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
        if (keywords.some(kw => title.includes(kw) || (article.description || '').includes(kw))) {
          relatedCountries.push(countryId);
        }
      }

      const { error } = await supabase.from('articles').insert({
        title_ja: title,
        body_ja: article.description || '',
        source_name: article.source?.name || '不明',
        source_url: article.url,
        source_country: 'JP',
        published_at: article.publishedAt,
        is_published: true,
        related_countries: relatedCountries,
      });

      if (!error) inserted++;
    }

    return NextResponse.json({ success: true, inserted });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
