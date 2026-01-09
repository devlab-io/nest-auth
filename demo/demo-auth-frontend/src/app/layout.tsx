import type { Metadata } from 'next';
import { AuthProvider } from '../providers/AuthProvider';
import { Navigation } from '../components/Navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'Demo Auth - nest-auth',
  description: 'Demo application for nest-auth',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="flex min-h-screen">
            <Navigation/>
            <main className="flex-1 p-8 bg-[var(--color-bg-primary)]">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
