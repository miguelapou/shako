import './globals.css';

export const metadata = {
  title: 'Land Cruiser Parts Tracker',
  description: 'Track your Land Cruiser restoration parts',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
export const metadata = {
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
}
