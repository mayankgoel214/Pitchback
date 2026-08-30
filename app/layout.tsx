import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://pitchback.vercel.app'),
  title: 'Pitchback — practise the call before it counts',
  description:
    'A voice sales trainer. Talk to a simulated buyer whose receptivity moves on a seven-state machine, then get scored on discovery, talk-to-listen, objection handling and the close.',
  openGraph: {
    title: 'Pitchback',
    description:
      'Practise a sales call out loud against a buyer who pushes back, and get scored on four things you can actually check.',
    type: 'website',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
