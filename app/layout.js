import './globals.css';

export const metadata = {
  title: 'Land Cruiser Parts Tracker',
  description: 'Track your Land Cruiser restoration parts',
  icons: {
    icon: [
      { url: '/icon.png' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
