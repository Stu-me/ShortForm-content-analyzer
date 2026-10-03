import { createHash, randomBytes, randomInt } from "node:crypto";

// Centralized OTP and token settings make expiry and attempt policies easy to change safely.
export const OTP_EXPIRY_MINUTES = 10;
export const RESET_TOKEN_EXPIRY_MINUTES = 15;
export const MAX_OTP_ATTEMPTS = 5;

export const createOtp = (): string => {
  // randomInt avoids predictable OTP sequences while keeping the code user-friendly.
  return randomInt(100000, 1000000).toString();
};

export const createResetToken = (): string => {
  return randomBytes(32).toString("hex");
};

// Hash OTPs and reset tokens so a database leak does not expose active credentials.
export const hashVerificationValue = (value: string): string => {
  return createHash("sha256").update(value).digest("hex");
};

export const getExpiryDate = (minutes: number): Date => {
  return new Date(Date.now() + minutes * 60 * 1000);
};
