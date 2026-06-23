'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShieldCheck, X, Timer, RotateCcw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSecurity } from '../context/SecurityContext';

const API_BASE_URL = '/api';

export default function OtpModal() {
  const { t } = useTranslation();
  const { isOtpModalOpen, setIsOtpModalOpen, confirmFrenchVerification } = useSecurity();

  // Navigation / Phase States
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpInputs, setOtpInputs] = useState<string[]>(Array(6).fill(''));
  
  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState(3);
  const [isShaking, setIsShaking] = useState(false); // Shaking animation trigger
  
  // Timers States
  const [resendTimer, setResendTimer] = useState(0);
  const [expiryTimer, setExpiryTimer] = useState(300); // 5 minutes in seconds

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset modal state on open/close
  useEffect(() => {
    if (isOtpModalOpen) {
      setStep('email');
      setEmail('');
      setOtpInputs(Array(6).fill(''));
      setAttemptsRemaining(3);
      setResendTimer(0);
      setExpiryTimer(300);
      setIsLoading(false);
      setIsShaking(false);
    }
  }, [isOtpModalOpen]);

  // Timers countdown tick
  useEffect(() => {
    if (!isOtpModalOpen || step !== 'otp') return;

    const interval = setInterval(() => {
      setExpiryTimer((prev) => {
        if (prev <= 1) {
          toast.error(t('modal.error_invalid_otp'));
          setIsOtpModalOpen(false);
          return 0;
        }
        return prev - 1;
      });

      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [isOtpModalOpen, step, setIsOtpModalOpen, t]);

  // Keyboard shortcut Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOtpModalOpen && !isLoading) {
        setIsOtpModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOtpModalOpen, isLoading, setIsOtpModalOpen]);

  // Focus helper for OTP inputs
  useEffect(() => {
    if (step === 'otp' && inputRefs.current[0]) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 600);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple frontend email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.');
      triggerShake();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('OTP sent successfully!');
        setStep('otp');
        setExpiryTimer(300); // 5 mins
        setResendTimer(60); // 60s throttle
        setOtpInputs(Array(6).fill(''));
        setAttemptsRemaining(3);
      } else {
        toast.error(data.error || 'Failed to send OTP.');
        triggerShake();
      }
    } catch (err) {
      console.error(err);
      toast.error('Cannot connect to backend server. Make sure the API is running.');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const otp = otpInputs.join('');
    if (otp.length !== 6) {
      toast.error('Please enter all 6 digits of the OTP.');
      triggerShake();
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(t('modal.success_verify'));
        confirmFrenchVerification();
      } else {
        // Handle failure and deduct attempts
        const attemptsLeft = attemptsRemaining - 1;
        setAttemptsRemaining(attemptsLeft);
        triggerShake();

        if (attemptsLeft <= 0) {
          toast.error(t('modal.error_attempts'));
          setIsOtpModalOpen(false);
        } else {
          toast.error(data.error || t('modal.error_invalid_otp'));
          // Clear inputs and focus first box
          setOtpInputs(Array(6).fill(''));
          inputRefs.current[0]?.focus();
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('An error occurred during verification.');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  // OTP Inputs keystroke and backspace logic
  const handleOtpChange = (index: number, value: string) => {
    if (/[^0-9]/.test(value)) return; // Allow numbers only

    const newOtp = [...otpInputs];
    const val = value.slice(-1);
    newOtp[index] = val;
    setOtpInputs(newOtp);

    // Auto Advance Focus
    if (val !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all filled
    const fullOtp = newOtp.join('');
    if (fullOtp.length === 6 && index === 5 && val !== '') {
      setTimeout(() => {
        setIsLoading(true);
        fetch(`${API_BASE_URL}/verify-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp: fullOtp }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              toast.success(t('modal.success_verify'));
              confirmFrenchVerification();
            } else {
              triggerShake();
              setAttemptsRemaining((prev) => {
                const left = prev - 1;
                if (left <= 0) {
                  toast.error(t('modal.error_attempts'));
                  setIsOtpModalOpen(false);
                } else {
                  toast.error(data.error || t('modal.error_invalid_otp'));
                  setOtpInputs(Array(6).fill(''));
                  inputRefs.current[0]?.focus();
                }
                return left;
              });
            }
          })
          .catch((err) => {
            console.error(err);
            toast.error('An error occurred during verification.');
            triggerShake();
          })
          .finally(() => setIsLoading(false));
      }, 50);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otpInputs[index] === '' && index > 0) {
        const newOtp = [...otpInputs];
        newOtp[index - 1] = '';
        setOtpInputs(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otpInputs];
        newOtp[index] = '';
        setOtpInputs(newOtp);
      }
    }
  };

  // OTP Paste code logic
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) {
      toast.error('Please paste a valid 6-digit numeric code.');
      triggerShake();
      return;
    }

    const digits = pastedData.split('');
    setOtpInputs(digits);
    inputRefs.current[5]?.focus();
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('A new OTP has been sent!');
        setResendTimer(60);
        setExpiryTimer(300);
        setOtpInputs(Array(6).fill(''));
        inputRefs.current[0]?.focus();
      } else {
        toast.error(data.error || 'Failed to resend OTP.');
        triggerShake();
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not connect to send a new OTP.');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isLoading && setIsOtpModalOpen(false)}
            className="absolute inset-0 bg-[#04020a]/80 backdrop-blur-md"
          />

          {/* Modal Card container with conditional shake animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 15 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className={`relative w-full max-w-md overflow-hidden rounded-3xl bg-[#0d081e]/90 border border-purple-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl z-10 ${
              isShaking ? 'animate-shake' : ''
            }`}
            role="dialog"
            aria-modal="true"
          >
            {/* Close */}
            <button
              onClick={() => setIsOtpModalOpen(false)}
              disabled={isLoading}
              className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-purple-950/30 transition-colors disabled:opacity-50"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {step === 'email' ? (
              /* Phase 1: Email Form */
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3.5 rounded-2xl bg-purple-600/10 text-purple-400 border border-purple-500/20 shadow-glow-violet">
                    <Mail className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {t('modal.title_email')}
                  </h2>
                  <p className="text-slate-400 text-sm max-w-sm">
                    {t('modal.desc_email')}
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email-input" className="block text-xs font-bold uppercase tracking-widest text-purple-400">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email-input"
                      type="email"
                      required
                      disabled={isLoading}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('modal.email_placeholder')}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#06030e] border border-purple-950/80 focus:border-purple-500 text-white placeholder-slate-600 focus:outline-none transition-all text-sm shadow-inner"
                    />
                    <Mail className="absolute left-4 top-4.5 w-4 h-4 text-purple-500/70" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-sm transition-all shadow-lg shadow-purple-600/25 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('modal.btn_sending')}
                    </span>
                  ) : (
                    t('modal.btn_send')
                  )}
                </button>
              </form>
            ) : (
              /* Phase 2: OTP Verification */
              <div className="space-y-6">
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="p-3.5 rounded-2xl bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 shadow-glow-cyan">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    {t('modal.title_otp')}
                  </h2>
                  <p className="text-slate-400 text-sm max-w-sm">
                    {t('modal.desc_otp')} <strong className="text-cyan-400 block truncate mt-1">{email}</strong>
                  </p>
                </div>

                {/* Grid of Inputs */}
                <div className="flex justify-between gap-2.5 max-w-xs mx-auto">
                  {otpInputs.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      disabled={isLoading}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      onPaste={handleOtpPaste}
                      ref={(el) => {
                        inputRefs.current[index] = el;
                      }}
                      className="w-11 h-13 text-center text-2xl font-extrabold text-white rounded-xl bg-[#06030e] border border-purple-950/80 focus:border-cyan-500 focus:outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>

                {/* Timers Panel */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-slate-400 bg-[#06030e]/85 p-3 rounded-2xl border border-purple-950/50">
                  <span className="flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-purple-400" />
                    {t('modal.timer_expire')}: <strong className="text-purple-300 font-mono">{formatTime(expiryTimer)}</strong>
                  </span>

                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className={`w-3.5 h-3.5 ${attemptsRemaining === 1 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`} />
                    {attemptsRemaining} {t('modal.attempts_left')}
                  </span>
                </div>

                {/* Resend Option */}
                <div className="flex justify-center">
                  {resendTimer > 0 ? (
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                      {t('modal.timer_resend')}: <strong className="font-mono text-slate-400">{resendTimer}s</strong>
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      {t('modal.btn_resend')}
                    </button>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsOtpModalOpen(false)}
                    disabled={isLoading}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-[#06030e] border border-purple-950/80 text-slate-400 hover:text-white font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    {t('modal.btn_cancel')}
                  </button>

                  <button
                    onClick={() => handleOtpSubmit()}
                    disabled={isLoading || otpInputs.join('').length !== 6}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-sm transition-all disabled:opacity-50 shadow-lg shadow-purple-600/25"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {t('modal.btn_verifying')}
                      </span>
                    ) : (
                      t('modal.btn_verify')
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
