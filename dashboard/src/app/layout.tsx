import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'LeetAI Agent — AI-Powered LeetCode Solver',
  description: 'Automatically solve LeetCode problems using local AI models (Ollama)',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className={`${inter.variable} ${jetbrains.variable} font-sans bg-[#050810] text-slate-100 antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'rgba(10, 14, 23, 0.95)',
              border: '1px solid rgba(0, 255, 136, 0.2)',
              color: '#e0e0e0',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12px',
            },
          }}
        />
      </body>
    </html>
  );
}
