import { NextResponse } from 'next/server';
import { runAllCrawlers } from '@/lib/crawlers/index';

export const maxDuration = 300;

export async function POST() {
  try {
    const results = await runAllCrawlers();
    const totalInserted = results.reduce((s, r) => s + r.articlesInserted, 0);
    return NextResponse.json({ success: true, results, totalInserted });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
