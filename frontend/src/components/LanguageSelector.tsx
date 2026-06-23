'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Globe } from 'lucide-react';
import { LANGUAGES, useSecurity } from '../context/SecurityContext';

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const { handleLanguageChange } = useSecurity();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLanguage = LANGUAGES.find((lang) => lang.code === i18n.language) || LANGUAGES[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-950/20 backdrop-blur-md border border-purple-900/40 hover:border-purple-700/60 text-slate-200 hover:text-white transition-all duration-300 font-medium text-sm shadow-sm"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="text-base leading-none">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.label}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl bg-[#0d081e]/95 backdrop-blur-xl border border-purple-950/80 p-1.5 shadow-2xl z-50 focus:outline-none"
            role="listbox"
          >
            <div className="px-2.5 py-1.5 text-xs text-purple-400/70 font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b border-purple-950/50 mb-1">
              <Globe className="w-3 h-3" />
              Select Language
            </div>
            {LANGUAGES.map((lang) => {
              const isActive = i18n.language === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    handleLanguageChange(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-200 text-left ${
                    isActive
                      ? 'bg-purple-600/10 text-purple-400 font-semibold'
                      : 'text-slate-300 hover:bg-purple-950/30 hover:text-white'
                  }`}
                  role="option"
                  aria-selected={isActive}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-50 shadow-glow-violet" />
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
