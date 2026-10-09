import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SchedNexa - Smart Academic Resource Manager',
  description: 'Do not let a cancelled lecture become a wasted academic hour.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
