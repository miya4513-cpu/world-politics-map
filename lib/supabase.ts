import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// データ取得関数
export async function getCountries() {
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .order('name_ja');
  
  if (error) throw error;
  return data;
}

export async function getCountryRelations() {
  const { data, error } = await supabase
    .from('country_relations')
    .select('*');
  
  if (error) throw error;
  return data;
}

export async function getPublishedArticles(limit = 5) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

export async function getMediaSources() {
 const { data, error } = await supabase
    .from('media_sources')
    .select('*')
    .order('name');
  
  if (error) throw error;
  return data;
}

export async function getArticleById(id: string) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching article:', error);
    return null;
  }
  
  return data;
}

export async function getCountryById(id: string) {
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching country:', error);
    return null;
  }
  
  return data;
}

export async function getCountryRelationsByCountry(countryId: string) {
  const { data, error } = await supabase
    .from('country_relations')
    .select('*')
    .or(`country_a.eq.countryId,countryb.eq.{countryId},country_b.eq.countryId,countryb​.eq.{countryId}`)
    .order('last_updated', { ascending: false });

  if (error) {
    console.error('Error fetching country relations:', error);
    return [];
  }
  
  return data;
}

export async function getCountryArticles(countryId: string, limit = 6) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('is_published', true)
    .contains('related_countries', [countryId])
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching country articles:', error);
    return [];
  }
  
  return data;
}

export async function getCountriesByRegion(region: string) {
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('region', region)
    .order('name_ja');

  if (error) {
    console.error('Error fetching countries by region:', error);
    return [];
  }
  
  return data;
}
