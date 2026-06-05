import { NextRequest, NextResponse } from 'next/server';
import { runAllCrawlers } from '@/lib/crawlers/index';

export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = await runAllCrawlers();
  const totalInserted = results.reduce((s, r) => s + r.articlesInserted, 0);
  return NextResponse.json({ success: true, results, totalInserted });
}
