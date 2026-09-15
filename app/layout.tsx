import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'Meu Board',
    template: '%s | Meu Board',
  },

  description:
    'Organize suas tarefas, prioridades, estudos, trabalho e rotina em um só lugar.',

  metadataBase: new URL(
    'https://trello.connectcode.site'
  ),

  openGraph: {
    title: 'Meu Board',
    description:
      'Organize suas tarefas, prioridades, estudos, trabalho e rotina em um só lugar.',
    url: 'https://trello.connectcode.site',
    siteName: 'Meu Board',
    type: 'website',
    locale: 'pt_BR',

    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Meu Board',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Meu Board',
    description:
      'Organize suas tarefas, prioridades, estudos, trabalho e rotina em um só lugar.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
