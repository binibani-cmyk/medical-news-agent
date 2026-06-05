import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Medical News Agent',
  description: 'AI-powered medical news collection from WHO, CDC, NIH, PubMed, and more',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
