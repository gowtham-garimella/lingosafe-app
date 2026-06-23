import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import prisma from '../../../lib/db';

const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }
  return null;
};

const hashOtp = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

const generateNumericOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = sendOtpSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = parseResult.data;

    // Throttle checks
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentOtp = await prisma.otpRecord.findFirst({
      where: {
        email,
        createdAt: { gte: oneMinuteAgo },
      },
    });

    if (recentOtp) {
      // Wait, let's write a safe time calculation
      const nextAllowedTime = recentOtp.createdAt.getTime() + 60 * 1000;
      const secondsLeft = Math.ceil((nextAllowedTime - Date.now()) / 1000);
      
      if (secondsLeft > 0) {
        return NextResponse.json(
          { error: `Please wait ${secondsLeft} seconds before requesting a new OTP.` },
          { status: 429 }
        );
      }
    }

    const rawOtp = generateNumericOtp();
    const hashedOtp = hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otpRecord.create({
      data: {
        email,
        otp: hashedOtp,
        expiresAt,
      },
    });

    const transporter = getTransporter();
    const fromAddress = process.env.SMTP_FROM || 'no-reply@lingosafe.com';

    if (transporter) {
      const mailOptions = {
        from: `"Security System" <${fromAddress}>`,
        to: email,
        subject: 'Security OTP Verification / Code de vérification OTP',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #8b5cf6; text-align: center;">Security Verification / Vérification de sécurité</h2>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p>You requested to change your language settings to French. To complete this action, please use the following one-time password (OTP):</p>
            <p><i>Vous avez demandé à changer vos paramètres de langue en français. Pour terminer cette action, veuillez utiliser le mot de passe à usage unique (OTP) suivant :</i></p>
            
            <div style="background-color: #f8fafc; border: 1px dashed #c084fc; border-radius: 6px; padding: 15px; text-align: center; margin: 25px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #581c87;">${rawOtp}</span>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">This code is valid for <strong>5 minutes</strong>. For security, do not share this code with anyone.</p>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 0;"><i>Ce code est valide pendant <strong>5 minutes</strong>. Pour des raisons de sécurité, ne partagez ce code avec personne.</i></p>
          </div>
        `,
      };
      await transporter.sendMail(mailOptions);
      console.log(`[SMTP] Sent OTP successfully to: ${email}`);
    } else {
      console.log('\n======================================================');
      console.log(`[SERVERLESS DEVELOPMENT MODE - EMAIL SIMULATION]`);
      console.log(`To: ${email}`);
      console.log(`OTP Code: ${rawOtp}`);
      console.log(`Expires: ${expiresAt.toLocaleString()}`);
      console.log('======================================================\n');
    }

    return NextResponse.json({ message: 'OTP sent successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Error in send-otp:', error);
    return NextResponse.json(
      { error: 'An internal error occurred while processing your request.' },
      { status: 500 }
    );
  }
}
