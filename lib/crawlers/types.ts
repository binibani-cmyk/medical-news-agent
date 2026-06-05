export interface RawArticle {
  title: string;
  url: string;
  source: string;
  sourceLabel: string;
  publishedAt: string | null;
  content: string | null;
}

export interface CollectionResult {
  source: string;
  sourceLabel: string;
  articlesFound: number;
  articlesInserted: number;
  error?: string;
}
