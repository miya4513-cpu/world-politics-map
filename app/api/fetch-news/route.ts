import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const COUNTRY_KEYWORDS: Record<string, string[]> = {
  US: ['United States', 'America', 'Trump', 'Washington', 'Biden'],
  CN: ['China', 'Chinese', 'Beijing', 'Xi Jinping'],
  RU: ['Russia', 'Putin', 'Moscow', 'Kremlin'],
  UA: ['Ukraine', 'Kyiv', 'Zelensky'],
  JP: ['Japan', 'Tokyo', 'Kishida', 'Ishiba'],
  KP: ['North Korea', 'Kim Jong'],
  IL: ['Israel', 'Netanyahu', 'Gaza'],
  PS: ['Palestine', 'Gaza', 'Hamas'],
  TW: ['Taiwan', 'Taipei'],
  KR: ['South Korea', 'Seoul'],
  IN: ['India', 'Modi', 'New Delhi'],
  IR: ['Iran', 'Tehran'],
  SA: ['Saudi Arabia', 'Riyadh'],
  DE: ['Germany', 'Berlin'],
  FR: ['France', 'Paris', 'Macron'],
  GB: ['Britain', 'UK', 'London', 'Starmer'],
};

export async function GET() {
  try {
    const apiKey = process.env.NEWSAPI_KEY;
    const url = `https://newsapi.org/v2/everything?q=diplomacy OR geopolitics OR "international relations" OR war OR sanctions&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'ok' || !data.articles) {
      return NextResponse.json({ error: data.message || 'No articles' }, { status: 400 });
    }

    let inserted = 0;
    for (const article of data.articles) {
      if (!article.title || article.title === '[Removed]') continue;

      const text = `${article.title} ${article.description || ''}`;
      const relatedCountries: string[] = [];

      for (const [countryId, keywords] of Object.entries(COUNTRY_KEYWORDS)) {
        if (keywords.some(kw => text.includes(kw))) {
          relatedCountries.push(countryId);
        }
      }

      const { error } = await supabase.from('articles').insert({
        title_ja: article.title,
        body_ja: article.description || '',
        source_name: article.source?.name || '不明',
        source_url: article.url,
        source_country: 'US',
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
