import "@/styles/globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import ClientLayout from "./ClientLayout";
import GoogleAnalytics from "./components/GoogleAnalytics";
import StructuredData from "./components/StructuredData";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata = {
  title: {
    default: "Tic Tac Toe Infinity - Play Online Multiplayer Game",
    template: "%s | Tic Tac Toe Infinity"
  },
  description: "Play Tic Tac Toe Infinity online with friends or challenge AI bots. A modern, responsive multiplayer version of the classic game with beautiful UI and real-time gameplay.",
  keywords: [
    "tic tac toe",
    "online game",
    "multiplayer game",
    "board game",
    "strategy game",
    "free game",
    "play online",
    "real-time game",
    "AI bot",
    "gaming"
  ],
  authors: [{ name: "Dev2th3Core" }],
  creator: "Dev2th3Core",
  publisher: "Dev2th3Core",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://tic-tac-toe-infinity.onrender.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://tic-tac-toe-infinity.onrender.app',
    title: 'Tic Tac Toe Infinity - Play Online Multiplayer Game',
    description: 'Play Tic Tac Toe Infinity online with friends or challenge AI bots. A modern, responsive multiplayer version of the classic game.',
    siteName: 'Tic Tac Toe Infinity',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Tic Tac Toe Infinity Game',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tic Tac Toe Infinity - Play Online Multiplayer Game',
    description: 'Play Tic Tac Toe Infinity online with friends or challenge AI bots. A modern, responsive multiplayer version of the classic game.',
    images: ['/logo.png'],
    creator: '@tictactoeinfinity',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  themeColor: '#ffffff',
  category: 'games',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Play Tic Tac Toe Infinity online with friends or challenge AI bots. A modern, responsive multiplayer version of the classic game with beautiful UI and real-time gameplay." />
        <meta name="keywords" content="tic tac toe, tic-tac-toe, tic-tac-toe infinity, online game, multiplayer game, board game, strategy game, free game, play online, real-time game, AI bot, gaming" />
        <meta name="author" content="Dev2th3Core" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tic-tac-toe-infinity.onrender.com" />
        <meta property="og:title" content="Tic Tac Toe Infinity - Play Online Multiplayer Game" />
        <meta property="og:description" content="Play Tic Tac Toe Infinity online with friends or challenge AI bots. A modern, responsive multiplayer version of the classic game." />
        <meta property="og:image" content="/logo.png" />
        <meta property="og:site_name" content="Tic Tac Toe Infinity" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tic Tac Toe Infinity - Play Online Multiplayer Game" />
        <meta name="twitter:description" content="Play Tic Tac Toe Infinity online with friends or challenge AI bots. A modern, responsive multiplayer version of the classic game." />
        <meta name="twitter:image" content="/logo.png" />
        <meta name="twitter:creator" content="@dev2th3core" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="application-name" content="Tic Tac Toe Infinity" />
        <meta name="apple-mobile-web-app-title" content="Tic Tac Toe Infinity" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://tic-tac-toe-infinity.onrender.com" />
        <title>Tic Tac Toe Infinity - Play Online Multiplayer Game</title>
      </head>
      <body className="antialiased">
        <GoogleAnalytics />
        <StructuredData />
        <ThemeProvider 
          attribute="class"
          defaultTheme="system"
          enableSystem={true}
          storageKey="theme"
          value={{
            light: "light",
            dark: "dark",
          }}
          disableTransitionOnChange
        >
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
} 