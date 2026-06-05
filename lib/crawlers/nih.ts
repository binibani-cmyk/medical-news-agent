import Parser from 'rss-parser';
import type { RawArticle } from './types';

const parser = new Parser({ timeout: 15000 });

export async function crawlNIH(): Promise<RawArticle[]> {
  const feed = await parser.parseURL('https://www.nih.gov/news-releases.rss');
  return feed.items
    .map((item) => ({
      title: item.title?.trim() || '',
      url: item.link?.trim() || '',
      source: 'nih',
      sourceLabel: 'NIH',
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      content: item.contentSnippet || item.content || null,
    }))
    .filter((a) => a.title && a.url);
}
