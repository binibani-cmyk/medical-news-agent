import Parser from 'rss-parser';
import type { RawArticle } from './types';

const parser = new Parser({ timeout: 15000 });

// Google News Health topic RSS
const HEALTH_RSS =
  'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVLQUFQAQ?hl=en-US&gl=US&ceid=US:en';

export async function crawlGoogleNews(): Promise<RawArticle[]> {
  const feed = await parser.parseURL(HEALTH_RSS);
  return feed.items
    .map((item) => ({
      title: item.title?.trim() || '',
      url: item.link?.trim() || '',
      source: 'google-news',
      sourceLabel: 'Google News',
      publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      content: item.contentSnippet || null,
    }))
    .filter((a) => a.title && a.url);
}
