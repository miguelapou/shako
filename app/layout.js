import './globals.css';

export const metadata = {
  title: 'Shako',
  description: 'Track your vehicle restoration projects',
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
