import { Request, Response } from 'express';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import prisma from '../db';

// Input Validation Schemas
const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
});

// Configure Mail Transporter
const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: { user, pass },
    });
  }
  return null;
};

/**
 * Hash code using SHA-256 for database safety
 */
const hashOtp = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

/**
 * Generate 6-digit random numeric OTP
 */
const generateNumericOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * POST /api/send-otp
 * Generates and sends OTP, stores hashed copy, throttles repeat requests to 60s.
 */
export const sendOtp = async (req: Request, res: Response) => {
  try {
    // 1. Validate email input
    const parseResult = sendOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: parseResult.error.errors[0].message 
      });
    }

    const { email } = parseResult.data;

    // 2. Throttle checks: Check if an OTP was sent within the last 60 seconds
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentOtp = await prisma.otpRecord.findFirst({
      where: {
        email,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentOtp) {
      const timeRemaining = Math.max(0, Math.ceil((recentOtp.createdAt.getTime() + 60 * 1000 - Date.now()) / 1000));
      return res.status(429).json({
        error: `Please wait ${timeRemaining} seconds before requesting a new OTP.`
      });
    }

    // 3. Generate OTP and store it
    const rawOtp = generateNumericOtp();
    const hashedOtp = hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    await prisma.otpRecord.create({
      data: {
        email,
        otp: hashedOtp,
        expiresAt,
      },
    });

    // 4. Send Email via SMTP or simulate in development
    const transporter = getTransporter();
    const fromAddress = process.env.SMTP_FROM || 'no-reply@multilingualapp.com';

    if (transporter) {
      const mailOptions = {
        from: `"Security System" <${fromAddress}>`,
        to: email,
        subject: 'Security OTP Verification / Code de vérification OTP',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #2563eb; text-align: center;">Security Verification / Vérification de sécurité</h2>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p>You requested to change your language settings to French. To complete this action, please use the following one-time password (OTP):</p>
            <p><i>Vous avez demandé à changer vos paramètres de langue en français. Pour terminer cette action, veuillez utiliser le mot de passe à usage unique (OTP) suivant :</i></p>
            
            <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 15px; text-align: center; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b;">${rawOtp}</span>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">This code is valid for <strong>5 minutes</strong>. For security, do not share this code with anyone.</p>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 0;"><i>Ce code est valide pendant <strong>5 minutes</strong>. Pour des raisons de sécurité, ne partagez ce code avec personne.</i></p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Sent OTP email successfully to: ${email}`);
    } else {
      // Development mode console output
      console.log('\n======================================================');
      console.log(`[DEVELOPMENT MODE - EMAIL SIMULATION]`);
      console.log(`To: ${email}`);
      console.log(`OTP Code: ${rawOtp}`);
      console.log(`Expires: ${expiresAt.toLocaleString()}`);
      console.log('======================================================\n');
    }

    return res.status(200).json({ 
      message: 'OTP sent successfully. Please check your inbox (or backend logs).' 
    });

  } catch (error) {
    console.error('Error in sendOtp:', error);
    return res.status(500).json({ 
      error: 'An internal error occurred while sending the OTP.' 
    });
  }
};

/**
 * POST /api/verify-otp
 * Verifies code, tracks limits, invalidates previous OTP records on success.
 */
export const verifyOtp = async (req: Request, res: Response) => {
  try {
    // 1. Validate body schema
    const parseResult = verifyOtpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        error: parseResult.error.errors[0].message 
      });
    }

    const { email, otp } = parseResult.data;

    // 2. Fetch the latest active, non-verified OTP record for the email
    const record = await prisma.otpRecord.findFirst({
      where: {
        email,
        verified: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!record) {
      return res.status(404).json({ 
        error: 'No OTP record found. Please request a new code.' 
      });
    }

    // 3. Check expiration
    if (record.expiresAt < new Date()) {
      return res.status(400).json({ 
        error: 'The OTP has expired. Please request a new code.' 
      });
    }

    // 4. Check block lock-out (max 3 verification attempts)
    const MAX_ATTEMPTS = 3;
    if (record.attempts >= MAX_ATTEMPTS) {
      return res.status(400).json({ 
        error: 'Too many incorrect attempts. Please request a new OTP.' 
      });
    }

    // 5. Verify match
    const hashedSubmittedOtp = hashOtp(otp);
    if (record.otp === hashedSubmittedOtp) {
      // Success!
      // Invalidate this OTP by setting verified = true
      await prisma.otpRecord.update({
        where: { id: record.id },
        data: { verified: true },
      });

      // Invalidate all other pending OTPs for this email address to prevent reuse
      await prisma.otpRecord.updateMany({
        where: {
          email,
          id: { not: record.id },
          verified: false,
        },
        data: {
          expiresAt: new Date(), // Expire immediately
        },
      });

      return res.status(200).json({ 
        success: true, 
        message: 'Security verification successful. Switch authorized.' 
      });
    } else {
      // Failure!
      const newAttempts = record.attempts + 1;
      
      // Update database attempts count
      await prisma.otpRecord.update({
        where: { id: record.id },
        data: { attempts: newAttempts },
      });

      const attemptsLeft = Math.max(0, MAX_ATTEMPTS - newAttempts);
      if (attemptsLeft === 0) {
        return res.status(400).json({ 
          error: 'Invalid OTP. You have exceeded the maximum of 3 attempts. Please request a new code.' 
        });
      }

      return res.status(400).json({ 
        error: `Invalid OTP. Verification failed. You have ${attemptsLeft} attempts remaining.` 
      });
    }

  } catch (error) {
    console.error('Error in verifyOtp:', error);
    return res.status(500).json({ 
      error: 'An internal error occurred during OTP verification.' 
    });
  }
};
