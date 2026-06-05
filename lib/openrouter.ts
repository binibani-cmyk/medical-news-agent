export async function summarizeArticle(title: string, content: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey || !content.trim()) return null;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://medical-news-agent.vercel.app',
        'X-Title': 'Medical News Agent',
      },
      body: JSON.stringify({
        model: 'openrouter/auto',
        messages: [
          {
            role: 'system',
            content:
              'You are a concise medical news summarizer. Summarize the article in 2-3 sentences highlighting key medical findings or health implications. Be factual and neutral. Respond in Korean.',
          },
          {
            role: 'user',
            content: `Title: ${title}\n\nContent: ${content.slice(0, 3000)}`,
          },
        ],
        max_tokens: 250,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return (data.choices?.[0]?.message?.content as string) || null;
  } catch {
    return null;
  }
}
