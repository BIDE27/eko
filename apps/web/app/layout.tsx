import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'eko. — Apprentissage & Compétitions Éducatives',
  description:
    'Application éducative de quiz, compétitions et tutorat IA propulsé par Gemini.',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-family='sans-serif' font-size='24' font-weight='bold' fill='%234f46e5'%3Ee.%3C/text%3E%3C/svg%3E",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
