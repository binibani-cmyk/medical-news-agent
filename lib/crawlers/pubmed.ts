import type { RawArticle } from './types';

interface ESearchResult {
  esearchresult: { idlist: string[] };
}

interface ESummaryResult {
  result: Record<string, {
    uid: string;
    title: string;
    source: string;
    pubdate: string;
    elocationid?: string;
    authors?: { name: string }[];
    sortfirstauthor?: string;
  }>;
}

const SEARCH_TERMS = 'disease+outbreak+OR+clinical+trial+OR+vaccine+OR+public+health';
const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

export async function crawlPubMed(): Promise<RawArticle[]> {
  const searchRes = await fetch(
    `${BASE}/esearch.fcgi?db=pubmed&term=${SEARCH_TERMS}&retmax=15&sort=date&retmode=json&datetype=pdat&reldate=7`,
    { signal: AbortSignal.timeout(15000) },
  );
  const searchData: ESearchResult = await searchRes.json();
  const ids = searchData.esearchresult?.idlist || [];
  if (ids.length === 0) return [];

  const summaryRes = await fetch(
    `${BASE}/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`,
    { signal: AbortSignal.timeout(15000) },
  );
  const summaryData: ESummaryResult = await summaryRes.json();

  const articles: RawArticle[] = [];
  for (const id of ids) {
    const art = summaryData.result[id];
    if (!art) continue;
    const title = art.title?.replace(/<[^>]+>/g, '').trim() || '';
    if (!title) continue;
    articles.push({
      title,
      url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
      source: 'pubmed',
      sourceLabel: 'PubMed',
      publishedAt: art.pubdate ? new Date(art.pubdate).toISOString() : null,
      content: `Published in ${art.source}. ${art.sortfirstauthor ? `First author: ${art.sortfirstauthor}.` : ''}`,
    });
  }
  return articles;
}
