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
          href="https://db.onlinewebfonts.com/t/f58c10cd63660152b6858a49e05fe609.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
