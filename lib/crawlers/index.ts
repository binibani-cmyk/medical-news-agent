import { supabaseAdmin } from '@/lib/supabase';
import { summarizeArticle } from '@/lib/openrouter';
import type { RawArticle, CollectionResult } from './types';
import { crawlWHO } from './who';
import { crawlCDC } from './cdc';
import { crawlNIH } from './nih';
import { crawlPubMed } from './pubmed';
import { crawlMedicalXpress } from './medicalxpress';
import { crawlGoogleNews } from './google-news';
import { crawlReuters } from './reuters';

const CRAWLERS: { fn: () => Promise<RawArticle[]>; source: string; label: string }[] = [
  { fn: crawlWHO, source: 'who', label: 'WHO' },
  { fn: crawlCDC, source: 'cdc', label: 'CDC' },
  { fn: crawlNIH, source: 'nih', label: 'NIH' },
  { fn: crawlPubMed, source: 'pubmed', label: 'PubMed' },
  { fn: crawlMedicalXpress, source: 'medicalxpress', label: 'MedicalXpress' },
  { fn: crawlGoogleNews, source: 'google-news', label: 'Google News' },
  { fn: crawlReuters, source: 'reuters', label: 'Reuters Health' },
];

async function runCrawler(
  crawler: (typeof CRAWLERS)[number],
): Promise<CollectionResult> {
  const logRes = await supabaseAdmin.from('collection_logs').insert({
    source: crawler.source,
    status: 'running',
  }).select('id').single();

  const logId = logRes.data?.id;

  try {
    const articles = await crawler.fn();
    let inserted = 0;

    for (const article of articles) {
      if (!article.title || !article.url) continue;

      // Check if URL already exists
      const { data: existing } = await supabaseAdmin
        .from('news_articles')
        .select('id')
        .eq('url', article.url)
        .maybeSingle();

      if (existing) continue;

      // Generate AI summary
      const summary = article.content
        ? await summarizeArticle(article.title, article.content)
        : null;

      const { error } = await supabaseAdmin.from('news_articles').insert({
        title: article.title,
        url: article.url,
        source: article.source,
        source_label: article.sourceLabel,
        published_at: article.publishedAt,
        content: article.content,
        summary,
      });

      if (!error) inserted++;
    }

    if (logId) {
      await supabaseAdmin
        .from('collection_logs')
        .update({ status: 'success', articles_collected: inserted, completed_at: new Date().toISOString() })
        .eq('id', logId);
    }

    return { source: crawler.source, sourceLabel: crawler.label, articlesFound: articles.length, articlesInserted: inserted };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (logId) {
      await supabaseAdmin
        .from('collection_logs')
        .update({ status: 'error', error_message: msg, completed_at: new Date().toISOString() })
        .eq('id', logId);
    }
    return { source: crawler.source, sourceLabel: crawler.label, articlesFound: 0, articlesInserted: 0, error: msg };
  }
}

export async function runAllCrawlers(): Promise<CollectionResult[]> {
  const results = await Promise.allSettled(CRAWLERS.map(runCrawler));
  return results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { source: CRAWLERS[i].source, sourceLabel: CRAWLERS[i].label, articlesFound: 0, articlesInserted: 0, error: String(r.reason) },
  );
}
