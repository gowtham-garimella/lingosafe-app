'use client';

import React, { useEffect, useState } from 'react';
import '../i18n';

export default function I18nProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Avoid server/client HTML hydration mismatch
  if (!mounted) {
    return <div className="min-h-screen bg-[#06030e] text-slate-100 flex items-center justify-center font-semibold tracking-wide">Loading LingoSafe...</div>;
  }

  return <>{children}</>;
}
