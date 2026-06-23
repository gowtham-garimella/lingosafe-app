'use client';

import React from 'react';
import { Toaster } from 'react-hot-toast';
import I18nProvider from './I18nProvider';
import { SecurityProvider } from '../context/SecurityContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SecurityProvider>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #1e293b',
              borderRadius: '16px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#0f172a',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#0f172a',
              },
            },
          }}
        />
      </SecurityProvider>
    </I18nProvider>
  );
}
