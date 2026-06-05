'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { RefreshCw, Activity, Search, Newspaper, Zap, Clock, Globe } from 'lucide-react';

const SOURCES = [
  { key: 'all', label: '전체' },
  { key: 'who', label: 'WHO' },
  { key: 'cdc', label: 'CDC' },
  { key: 'nih', label: 'NIH' },
  { key: 'pubmed', label: 'PubMed' },
  { key: 'medicalxpress', label: 'MedicalXpress' },
  { key: 'google-news', label: 'Google News' },
  { key: 'reuters', label: 'Reuters Health' },
];

const SOURCE_STYLE: Record<string, { bg: string; text: string }> = {
  who: { bg: 'bg-blue-600', text: 'WHO' },
  cdc: { bg: 'bg-red-600', text: 'CDC' },
  nih: { bg: 'bg-emerald-600', text: 'NIH' },
  pubmed: { bg: 'bg-purple-600', text: 'PubMed' },
  medicalxpress: { bg: 'bg-orange-500', text: 'MedicalXpress' },
  'google-news': { bg: 'bg-yellow-600', text: 'Google News' },
  reuters: { bg: 'bg-indigo-600', text: 'Reuters' },
};

interface Article {
  id: string;
  title: string;
  url: string;
  source: string;
  source_label: string;
  published_at: string | null;
  summary: string | null;
  created_at: string;
}

interface CollectResult {
  source: string;
  sourceLabel: string;
  articlesFound: number;
  articlesInserted: number;
  error?: string;
}

function SkeletonCard() {
  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 w-16 bg-slate-800 rounded-full" />
        <div className="h-3 w-20 bg-slate-800 rounded" />
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-4 bg-slate-800 rounded w-full" />
        <div className="h-4 bg-slate-800 rounded w-5/6" />
      </div>
      <div className="h-3 bg-slate-800 rounded w-2/3" />
    </div>
  );
}

function ArticleCard({ article }: { article: Article }) {
  const style = SOURCE_STYLE[article.source] || { bg: 'bg-slate-600', text: article.source_label };
  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { locale: ko, addSuffix: true })
    : null;

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-slate-900 hover:bg-slate-800/80 rounded-2xl border border-slate-800 hover:border-slate-600 p-5 flex flex-col gap-3 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`${style.bg} text-white text-xs font-semibold px-2.5 py-1 rounded-full shrink-0`}>
          {article.source_label}
        </span>
        {timeAgo && (
          <span className="text-slate-500 text-xs flex items-center gap-1 shrink-0">
            <Clock className="w-3 h-3" />
            {timeAgo}
          </span>
        )}
      </div>

      <h2 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-blue-400 transition-colors">
        {article.title}
      </h2>

      {article.summary && (
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Zap className="w-3 h-3 text-blue-400" />
            <span className="text-blue-400 text-xs font-medium">AI 요약</span>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">{article.summary}</p>
        </div>
      )}
    </a>
  );
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [collecting, setCollecting] = useState(false);
  const [collectResults, setCollectResults] = useState<CollectResult[] | null>(null);
  const [activeSource, setActiveSource] = useState('all');
  const [search, setSearch] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchArticles = useCallback(async (source: string) => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '120' });
    if (source !== 'all') params.set('source', source);
    try {
      const res = await fetch(`/api/news?${params}`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
        setLastUpdated(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerCollection = async () => {
    setCollecting(true);
    setCollectResults(null);
    try {
      const res = await fetch('/api/collect', { method: 'POST' });
      const data = await res.json();
      setCollectResults(data.results || null);
      await fetchArticles(activeSource);
    } finally {
      setCollecting(false);
    }
  };

  useEffect(() => {
    fetchArticles(activeSource);
  }, [activeSource, fetchArticles]);

  const filtered = search
    ? articles.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          (a.summary && a.summary.toLowerCase().includes(search.toLowerCase())),
      )
    : articles;

  const summarizedCount = articles.filter((a) => a.summary).length;

  return (
    <main className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-xl p-2.5 shadow-lg shadow-blue-600/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Medical News Agent</h1>
              <p className="text-xs text-slate-400">
                {lastUpdated
                  ? `${formatDistanceToNow(lastUpdated, { locale: ko, addSuffix: true })} 업데이트`
                  : '불러오는 중...'}
              </p>
            </div>
          </div>
          <button
            onClick={triggerCollection}
            disabled={collecting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${collecting ? 'animate-spin' : ''}`} />
            {collecting ? '수집 중...' : '뉴스 수집'}
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Newspaper, label: '전체 기사', value: articles.length },
            { icon: Globe, label: '활성 소스', value: 7 },
            { icon: Zap, label: 'AI 요약', value: summarizedCount },
            { icon: Clock, label: '수집 주기', value: '1h' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-slate-400" />
                <p className="text-slate-400 text-xs">{label}</p>
              </div>
              <p className="text-2xl font-bold">{value}</p>
            </div>
          ))}
        </div>

        {/* Collection results */}
        {collectResults && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
            <h3 className="text-sm font-semibold mb-3 text-slate-300">수집 결과</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {collectResults.map((r) => (
                <div
                  key={r.source}
                  className={`rounded-xl p-3 text-xs ${r.error ? 'bg-red-900/30 border border-red-800' : 'bg-slate-800 border border-slate-700'}`}
                >
                  <p className="font-semibold mb-1">{r.sourceLabel}</p>
                  {r.error ? (
                    <p className="text-red-400 truncate">{r.error}</p>
                  ) : (
                    <p className="text-slate-400">
                      발견 {r.articlesFound} · 저장 <span className="text-emerald-400 font-bold">{r.articlesInserted}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="기사 제목 또는 요약 검색..."
            className="w-full bg-slate-900 border border-slate-800 focus:border-blue-600 rounded-xl pl-10 pr-4 py-3 text-sm placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Source filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {SOURCES.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSource(s.key)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all shrink-0 ${
                activeSource === s.key
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Articles */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Globe className="w-14 h-14 mb-4 opacity-20" />
            <p className="text-lg font-medium mb-1">기사가 없습니다</p>
            <p className="text-sm">상단의 <strong className="text-slate-400">뉴스 수집</strong> 버튼을 눌러 데이터를 가져오세요</p>
          </div>
        ) : (
          <>
            <p className="text-slate-500 text-sm">{filtered.length}개 기사</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((a) => <ArticleCard key={a.id} article={a} />)}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
