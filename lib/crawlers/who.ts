import Parser from 'rss-parser';
import type { RawArticle } from './types';

const parser = new Parser({ timeout: 15000 });

export async function crawlWHO(): Promise<RawArticle[]> {
  const feed = await parser.parseURL('https://www.who.int/rss-feeds/news-english.xml');
  return feed.items
    .map((item) => ({
      title: item.title?.trim() || '',
      url: item.link?.trim() || '',
      source: 'who',
      sourceLabel: 'WHO',
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      content: item.contentSnippet || item.content || null,
    }))
    .filter((a) => a.title && a.url);
}
