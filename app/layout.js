import './globals.css';

export const metadata = {
  title: 'Takumi Garage',
  description: 'Track your Land Cruiser restoration parts',
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
