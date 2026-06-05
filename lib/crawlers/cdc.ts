import Parser from 'rss-parser';
import type { RawArticle } from './types';

const parser = new Parser({ timeout: 15000 });

export async function crawlCDC(): Promise<RawArticle[]> {
  // CDC Newsroom RSS
  const feed = await parser.parseURL(
    'https://tools.cdc.gov/api/v2/resources/media/316422.rss',
  );
  return feed.items
    .map((item) => ({
      title: item.title?.trim() || '',
      url: item.link?.trim() || '',
      source: 'cdc',
      sourceLabel: 'CDC',
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      content: item.contentSnippet || item.content || null,
    }))
    .filter((a) => a.title && a.url);
}
