import './globals.css';
import '../styles/custom.css';

export const metadata = {
  title: 'Shako',
  description: 'Track your vehicle restoration projects',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Preload custom font to reduce FOUT */}
        <link
          rel="preload"
          href="/fonts/FoundationOne.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
