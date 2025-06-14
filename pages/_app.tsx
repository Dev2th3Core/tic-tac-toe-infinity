import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Log initial state
    console.log('Initial HTML classes:', document.documentElement.className);
    console.log('Initial body classes:', document.body.className);

    // Force a re-render when the theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          console.log('Theme class changed:', document.documentElement.className);
          console.log('Body classes:', document.body.className);
          console.log('Computed styles:', window.getComputedStyle(document.body));
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <ThemeProvider 
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="theme"
      value={{
        light: "light",
        dark: "dark"
      }}
    >
      <div className="min-h-screen bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors duration-200">
        <Component {...pageProps} />
      </div>
    </ThemeProvider>
  );
}
