import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';
import prisma from '../../../lib/db';

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
});

const hashOtp = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseResult = verifyOtpSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: parseResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, otp } = parseResult.data;

    // Fetch the latest active, non-verified OTP record
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
      return NextResponse.json(
        { error: 'No OTP record found. Please request a new code.' },
        { status: 404 }
      );
    }

    // Check expiration
    if (record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'The OTP has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check lockout limits
    const MAX_ATTEMPTS = 3;
    if (record.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // Verify code
    const hashedSubmittedOtp = hashOtp(otp);
    if (record.otp === hashedSubmittedOtp) {
      // Success! Invalidate this OTP by setting verified = true
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

      return NextResponse.json(
        { success: true, message: 'Security verification successful. Switch authorized.' },
        { status: 200 }
      );
    } else {
      // Failure! Increment attempts count
      const newAttempts = record.attempts + 1;
      
      await prisma.otpRecord.update({
        where: { id: record.id },
        data: { attempts: newAttempts },
      });

      const attemptsLeft = Math.max(0, MAX_ATTEMPTS - newAttempts);
      if (attemptsLeft === 0) {
        return NextResponse.json(
          { error: 'Invalid OTP. You have exceeded the maximum of 3 attempts. Please request a new code.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Invalid OTP. Verification failed. You have ${attemptsLeft} attempts remaining.` },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json(
      { error: 'An internal error occurred during OTP verification.' },
      { status: 500 }
    );
  }
}
