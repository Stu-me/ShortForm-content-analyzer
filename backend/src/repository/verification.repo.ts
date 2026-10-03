import {
  otpVerificationModel,
  passwordResetTokenModel,
  type IOtpVerification,
  type IPasswordResetToken,
  type VerificationPurpose,
} from "../models/verification.model.js";

// Repository functions isolate MongoDB operations from OTP business rules in the service layer.
interface CreateOtpData {
  email: string;
  userName?: string;
  password?: string;
  purpose: VerificationPurpose;
  otpHash: string;
  expiresAt: Date;
}

interface CreateResetTokenData {
  email: string;
  tokenHash: string;
  expiresAt: Date;
}

export const replaceOtpVerification = async (
  data: CreateOtpData,
): Promise<IOtpVerification> => {
  // Only the newest OTP for a purpose remains valid for an email address.
  await otpVerificationModel.deleteMany({
    email: data.email,
    purpose: data.purpose,
  });
  return otpVerificationModel.create(data);
};

export const findOtpVerification = async (
  email: string,
  purpose: VerificationPurpose,
): Promise<IOtpVerification | null> => {
  return otpVerificationModel.findOne({ email, purpose });
};

export const incrementOtpAttempts = async (id: string): Promise<void> => {
  await otpVerificationModel.findByIdAndUpdate(id, { $inc: { attempts: 1 } });
};

export const deleteOtpVerification = async (id: string): Promise<void> => {
  await otpVerificationModel.findByIdAndDelete(id);
};

export const createPasswordResetToken = async (
  data: CreateResetTokenData,
): Promise<IPasswordResetToken> => {
  // A new reset flow invalidates any older reset token for the same account.
  await passwordResetTokenModel.deleteMany({ email: data.email });
  return passwordResetTokenModel.create(data);
};

export const findPasswordResetToken = async (
  tokenHash: string,
): Promise<IPasswordResetToken | null> => {
  return passwordResetTokenModel.findOne({ tokenHash });
};

export const deletePasswordResetToken = async (id: string): Promise<void> => {
  await passwordResetTokenModel.findByIdAndDelete(id);
};
