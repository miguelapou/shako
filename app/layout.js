import './globals.css';

export const metadata = {
  title: 'Land Cruiser Parts Tracker',
  description: 'Track your Land Cruiser restoration parts',
  icons: {
    icons: {
    icon: '/icon.png',
    apple: '/icon.png',  // Critical for Safari!
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
