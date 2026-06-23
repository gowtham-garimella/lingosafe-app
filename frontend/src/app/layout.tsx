import type { Metadata } from 'next';
import './globals.css';
import Providers from '../components/Providers';
import Header from '../components/Header';
import OtpModal from '../components/OtpModal';

export const metadata: Metadata = {
  title: 'LingoSafe Multilingual - Instant Translation & Secure OTP Verification',
  description: 'Experience a secure production-ready multilingual application supporting six major languages with instant updates and email-verified French language protection.',
  keywords: ['nextjs', 'react', 'typescript', 'multilingual', 'i18n', 'OTP verification', 'nodemailer', 'tailwindcss'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col bg-[#06030e] bg-grid-pattern text-slate-100 selection:bg-purple-600/30 selection:text-purple-200">
        <Providers>
          {/* Header/Nav */}
          <Header />

          {/* Main Area */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-purple-950/50 bg-[#06030e] py-8 text-center text-xs text-slate-500">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-2">
              <p>&copy; {new Date().getFullYear()} LingoSafe. All rights reserved.</p>
              <p>Designed for premium security and instant internationalization.</p>
            </div>
          </footer>

          {/* Modal Injection */}
          <OtpModal />
        </Providers>
      </body>
    </html>
  );
}
