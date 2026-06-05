import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source');
  const q = searchParams.get('q');
  const limit = Math.min(parseInt(searchParams.get('limit') || '120'), 300);

  let query = supabaseAdmin
    .from('news_articles')
    .select('id, title, url, source, source_label, published_at, summary, created_at')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (source) query = query.eq('source', source);
  if (q) query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ articles: data || [] });
}
