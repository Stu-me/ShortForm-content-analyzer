import { model, type Document, Schema } from "mongoose";

// These collections keep short-lived verification data separate from permanent user accounts.
export type VerificationPurpose = "registration" | "password-reset";

export interface IOtpVerification extends Document {
  email: string;
  userName?: string;
  password?: string;
  purpose: VerificationPurpose;
  otpHash: string;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPasswordResetToken extends Document {
  email: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const otpVerificationSchema = new Schema<IOtpVerification>({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  userName: { type: String, lowercase: true, trim: true },
  password: { type: String },
  purpose: {
    type: String,
    enum: ["registration", "password-reset"],
    required: true,
    index: true,
  },
  otpHash: { type: String, required: true },
  attempts: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

// Reset tokens have their own TTL because they outlive the OTP that creates them.
const passwordResetTokenSchema = new Schema<IPasswordResetToken>({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

export const otpVerificationModel = model<IOtpVerification>("otpVerification", otpVerificationSchema);
export const passwordResetTokenModel = model<IPasswordResetToken>("passwordResetToken", passwordResetTokenSchema);
