'use client';

import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/Sidebar';
import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { useEffect, useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

interface LayoutContextProps extends LayoutProps {
  // toggleDarkMode: () => void;
}

const LayoutContext = React.createContext<LayoutContextProps | null>(null);

function LayoutContent({ children }: LayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [key, setKey] = useState(0);
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');

  const forceUpdate = () => setKey(prev => prev + 1);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <LayoutContext.Provider value={{ children }}>
      {!isAuthPage ? (
        <AuthGuard>
          <div className="d-flex" style={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
            <Sidebar />
            <main className="flex-grow-1" style={{ overflowY: 'auto', padding: pathname === '/sacmais' ? '0' : '1rem' }}>
              {children}
            </main>
          </div>
        </AuthGuard>
      ) : (
        <main className="flex-grow-1 p-4">
          {children}
        </main>
      )}
    </LayoutContext.Provider>
  );
}

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <LayoutContent>{children}</LayoutContent>
      </body>
    </html>
  );
}
