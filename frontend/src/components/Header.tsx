'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

export default function Header() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-950/60 bg-[#06030e]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-cyan-500 shadow-md shadow-purple-500/25">
            <span className="font-extrabold text-lg text-white">L</span>
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            {t('nav.title')}
          </span>
        </div>

        {/* Navigation Anchor Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-400">
          <a href="#home" id="nav-link-home" className="hover:text-white transition-colors">
            {t('nav.home')}
          </a>
          <a href="#features" id="nav-link-features" className="hover:text-white transition-colors">
            {t('nav.features')}
          </a>
          <a href="#about" id="nav-link-about" className="hover:text-white transition-colors">
            {t('nav.about')}
          </a>
        </nav>

        {/* Language Selector Dropdown */}
        <div className="flex items-center gap-4">
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
}
