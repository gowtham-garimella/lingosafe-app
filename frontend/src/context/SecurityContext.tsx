'use client';

import React, { createContext, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface Language {
  code: string;
  label: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

interface SecurityContextType {
  isOtpModalOpen: boolean;
  setIsOtpModalOpen: (open: boolean) => void;
  pendingLanguage: string | null;
  handleLanguageChange: (langCode: string) => void;
  confirmFrenchVerification: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<string | null>(null);
  const { i18n } = useTranslation();

  const handleLanguageChange = (langCode: string) => {
    if (langCode === 'fr') {
      // Security Interception for French
      setPendingLanguage('fr');
      setIsOtpModalOpen(true);
    } else {
      // Normal immediate switch
      i18n.changeLanguage(langCode);
    }
  };

  const confirmFrenchVerification = () => {
    // If successfully verified, switch language to French
    i18n.changeLanguage('fr');
    setIsOtpModalOpen(false);
    setPendingLanguage(null);
  };

  return (
    <SecurityContext.Provider
      value={{
        isOtpModalOpen,
        setIsOtpModalOpen,
        pendingLanguage,
        handleLanguageChange,
        confirmFrenchVerification,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
