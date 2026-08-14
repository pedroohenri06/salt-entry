import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://salt-entry.vercel.app'),
  title: 'Salt — Entry',
  description: 'Produtos digitais para empresas que pretendem liderar o próprio mercado.',
  openGraph: {
    title: 'Salt — Entry',
    description: 'Produtos digitais para empresas que pretendem liderar o próprio mercado.',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Salt',
  },
  twitter: { card: 'summary_large_image', title: 'Salt — Entry' },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
  icons: { icon: '/brand/salt-mark.png', apple: '/brand/salt-mark.png' },
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
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}
