'use client';

import { useEffect, useState } from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      mounted ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white' : 'bg-white'
    }`}>
      {children}
    </div>
  );
} 