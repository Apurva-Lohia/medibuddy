import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Navigation from '@/components/layout/Navigation/Navigation';

export const metadata: Metadata = {
  title: 'MediCare Companion',
  description: 'Your trusted healthcare companion for medication management and drug interaction checking',
  icons: {
    icon: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="10" fill="%230d9488"/><path d="M20 10C14.477 10 10 14.477 10 20C10 25.523 14.477 30 20 30C25.523 30 30 25.523 30 20C30 14.477 25.523 10 20 10Z" stroke="white" stroke-width="2" fill="none"/><circle cx="20" cy="20" r="3" fill="white"/></svg>',
        type: 'image/svg+xml',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <Navigation />
          <main>{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
