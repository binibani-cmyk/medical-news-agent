import Parser from 'rss-parser';
import type { RawArticle } from './types';

const parser = new Parser({ timeout: 15000 });

// Reuters health via Google News search
const REUTERS_RSS =
  'https://news.google.com/rss/search?q=reuters+health+medicine+disease&hl=en-US&gl=US&ceid=US:en';

export async function crawlReuters(): Promise<RawArticle[]> {
  const feed = await parser.parseURL(REUTERS_RSS);
  return feed.items
    .map((item) => ({
      title: item.title?.trim() || '',
      url: item.link?.trim() || '',
      source: 'reuters',
      sourceLabel: 'Reuters Health',
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      content: item.contentSnippet || null,
    }))
    .filter((a) => a.title && a.url);
}
