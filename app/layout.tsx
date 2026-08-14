import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://salt-entry.vercel.app'),
  title: 'Salt — Entry',
  description: 'Estratégia, tecnologia e performance para operações que não vieram disputar o segundo lugar.',
  openGraph: {
    title: 'Salt — Entry',
    description: 'Estratégia, tecnologia e performance para operações que não vieram disputar o segundo lugar.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Salt',
  },
  twitter: { card: 'summary_large_image', title: 'Salt — Entry' },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
  icons: { icon: '/brand/icon.png', apple: '/brand/icon.png' },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preload" as="image" href="/brand/salt-word.webp" fetchPriority="high" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
