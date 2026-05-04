import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const COUNTRY_KEYWORDS: Record<string, string[]> = {
  US: ['アメリカ', '米国', 'トランプ'],
  CN: ['中国', '習近平'],
  RU: ['ロシア', 'プーチン'],
  UA: ['ウクライナ'],
  JP: ['日本', '外交'],
  KP: ['北朝鮮'],
  IL: ['イスラエル'],
  PS: ['パレスチナ', 'ガザ'],
  TW: ['台湾'],
  KR: ['韓国'],
  IN: ['インド'],
};

export async function GET() {
  try {
    const apiKey = process.env.GNEWS_API_KEY;
    const query = '国際政治 OR 外交 OR 安全保障';
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=ja&max=10&apikey=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.articles) {
      return NextResponse.json({ error: 'No articles' }, { status: 400 });
    }

    let inserted = 0;
    for (const article of data.articles) {
      const title = article.title;
      const relatedCountries: string[] = [];

      for (const [countryId, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
        if (keywords.some(kw => title.includes(kw))) {
          relatedCountries.push(countryId);
        }
      }

      const { error } = await supabase.from('articles').insert({
        title_ja: title,
        body_ja: article.description || '',
        source_name: article.source.name,
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
