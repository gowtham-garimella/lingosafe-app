'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Languages, ShieldAlert, Sparkles, ArrowRight, Activity } from 'lucide-react';
import { useSecurity, LANGUAGES } from '../context/SecurityContext';

export default function Home() {
  const { t, i18n } = useTranslation();
  const { handleLanguageChange } = useSecurity();

  const currentLanguageObj = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  return (
    <div id="home" className="relative isolate overflow-hidden min-h-screen bg-[#06030e] flex flex-col justify-center">
      
      {/* Dynamic Animated Glow Spheres */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Violet Sphere Top-Left */}
        <div 
          className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-purple-600/10 blur-[120px] animate-float-slow"
        />
        {/* Cyan Sphere Bottom-Right */}
        <div 
          className="absolute bottom-10 right-0 w-[45rem] h-[45rem] rounded-full bg-cyan-500/10 blur-[140px] animate-float-delayed"
        />
        {/* Pink Center Glow */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] rounded-full bg-pink-500/5 blur-[120px] pointer-events-none"
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-16 sm:pb-32 lg:px-8 lg:pt-24 relative">
        <div className="mx-auto max-w-3xl text-center space-y-10">
          
          {/* Active Language Badge (Pops & scales on language change) */}
          <motion.div 
            key={i18n.language}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-950/20 backdrop-blur-md border border-purple-500/20 text-xs font-semibold text-purple-300 shadow-glow-violet"
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Active Language:</span>
            <span className="text-base leading-none">{currentLanguageObj.flag}</span>
            <span className="text-slate-100 font-bold">{currentLanguageObj.label}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 text-[10px]">
              {i18n.language.toUpperCase()}
            </span>
          </motion.div>

          {/* Heading with Cyber Violet-Cyan Gradient & Text Glow */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl leading-none"
          >
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent text-glow-violet">
              {t('hero.title')}
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="text-base sm:text-lg leading-relaxed text-slate-400 max-w-xl mx-auto"
          >
            {t('hero.subtitle')}
          </motion.p>

          {/* Action Buttons with Dynamic Scale Transitions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#features"
              id="cta-get-started"
              className="w-full sm:w-auto rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg hover:from-purple-500 hover:to-cyan-400 transition-all hover:scale-105 duration-300 shadow-glow-violet flex items-center justify-center gap-2 group"
            >
              {t('hero.cta')}
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            
            {i18n.language !== 'fr' && (
              <button
                onClick={() => handleLanguageChange('fr')}
                id="btn-quick-verify-french"
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-purple-900/60 bg-purple-950/10 text-purple-300 hover:text-white hover:border-purple-700/60 hover:bg-purple-950/20 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300"
              >
                Verify French 🇫🇷
              </button>
            )}
          </motion.div>
        </div>

        {/* Features Section */}
        <section id="features" className="mx-auto mt-32 max-w-5xl sm:mt-40">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-xs font-bold leading-7 text-cyan-400 uppercase tracking-widest">{t('nav.features')}</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              {t('features.title')}
            </p>
          </div>

          <div className="grid max-w-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            
            {/* Feature 1: Instant Translation */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col rounded-3xl glass-panel p-6 sm:p-8 hover:shadow-glow-violet transition-all duration-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-600/10 text-purple-400 border border-purple-500/25 mb-6">
                <Languages className="h-5.5 w-5.5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('features.i18n_title')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed flex-1">{t('features.i18n_desc')}</p>
            </motion.div>

            {/* Feature 2: French Shield */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col rounded-3xl bg-rose-950/20 border border-rose-900/20 p-6 sm:p-8 hover:shadow-2xl hover:shadow-rose-600/10 transition-all duration-300"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-600/10 text-rose-400 border border-rose-500/25 mb-6">
                <ShieldAlert className="h-5.5 w-5.5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('features.security_title')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed flex-1">{t('features.security_desc')}</p>
            </motion.div>

            {/* Feature 3: Modern Style / Glassmorphism */}
            <motion.div 
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col rounded-3xl glass-panel-cyan p-6 sm:p-8 hover:shadow-glow-cyan transition-all duration-300 sm:col-span-2 lg:col-span-1"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-600/10 text-cyan-400 border border-cyan-500/25 mb-6">
                <Sparkles className="h-5.5 w-5.5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t('features.design_title')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed flex-1">{t('features.design_desc')}</p>
            </motion.div>
          </div>
        </section>

        {/* Demo instructions */}
        <section className="mx-auto mt-28 max-w-4xl p-8 sm:p-10 rounded-3xl bg-slate-900/30 border border-purple-950/50 shadow-2xl relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-48 h-48 bg-purple-500/5 rounded-full blur-2xl" />
          
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            How to Test the Security Flow
          </h3>
          
          <ol className="list-decimal list-inside space-y-4 text-sm text-slate-400">
            <li>Open the language dropdown in the top-right and select <strong className="text-purple-300">Français 🇫🇷</strong>.</li>
            <li>A verification modal will block the language switch, requiring you to enter an email address.</li>
            <li>Submit your email. If SMTP variables are not set in the backend <code className="px-1.5 py-0.5 rounded bg-[#090514] text-cyan-400 text-xs border border-purple-950">.env</code>, check your <strong className="text-purple-300">backend server terminal logs</strong> to copy the generated 6-digit OTP code.</li>
            <li>Copy the code, paste or enter it in the boxes, and submit. If correct, the UI will transition seamlessly to French!</li>
          </ol>
        </section>

        {/* About Section */}
        <section id="about" className="mx-auto mt-32 max-w-5xl sm:mt-40 mb-10">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-xs font-bold leading-7 text-purple-400 uppercase tracking-widest">{t('nav.about')}</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              About LingoSafe
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white tracking-tight">Secure Language Access Control</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                LingoSafe was created to address advanced regional requirements. In custom corporate environments, accessing certain localized pages requires secure verification of the user's corporate email credentials to safeguard information flow.
              </p>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our application integrates Next.js client-side translation routing with a secure Express backend check. By combining email verification, 5-minute OTP expirations, and a 3-attempt limit lockout, LingoSafe ensures secure access.
              </p>
            </div>
            
            <div className="rounded-3xl border border-purple-950/60 bg-[#0d081e]/40 p-8 backdrop-blur-md relative overflow-hidden shadow-glow-violet">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
              <h4 className="text-lg font-bold text-white mb-4">Security Parameters</h4>
              <ul className="space-y-3.5 text-slate-300 text-sm">
                <li className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Hashing algorithm: <strong>SHA-256</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>OTP Lifespan: <strong>5 Minutes</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Max Verify Attempts: <strong>3 Per Token</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Resend Cooldown: <strong>60 Seconds</strong></span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
