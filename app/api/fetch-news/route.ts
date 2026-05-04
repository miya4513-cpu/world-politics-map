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
  JP: ['日本', '石破'],
  KP: ['北朝鮮'],
  IL: ['イスラエル'],
  PS: ['パレスチナ', 'ガザ'],
  TW: ['台湾'],
  KR: ['韓国'],
  IN: ['インド'],
  IR: ['イラン'],
  SA: ['サウジ'],
  DE: ['ドイツ'],
  FR: ['フランス'],
  GB: ['イギリス'],
};

const RSS_FEEDS = [
  'https://www3.nhk.or.jp/rss/news/cat6.xml',
  'https://www3.nhk.or.jp/rss/news/cat0.xml',
];

export async function GET() {
  try {
    let inserted = 0;

    for (const feedUrl of RSS_FEEDS) {
      const res = await fetch(feedUrl);
      const xml = await res.text();
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

      for (const item of items) {
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || '';
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] || item.match(/<guid>(.*?)<\/guid>/)?.[1] || '';
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || new Date().toISOString();
        const desc = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || '';

        if (!title || !link) continue;

        const relatedCountries: string[] = [];
        for (const [id, kws] of Object.entries(COUNTRY_KEYWORDS)) {
          if (kws.some(kw => title.includes(kw) || desc.includes(kw))) {
            relatedCountries.push(id);
          }
        }

        const { error } = await supabase.from('articles').insert({
          title_ja: title,
          body_ja: desc,
          source_name: 'NHK',
          source_url: link,
          source_country: 'JP',
          published_at: new Date(pubDate).toISOString(),
          is_published: true,
          related_countries: relatedCountries,
        });

        if (!error) inserted++;
      }
    }

    return NextResponse.json({ success: true, inserted });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
