import { hashPassword, verifyPassword } from "../utility/hashing.utility.js";
import { createUser, findUser, findUserByEmail, tokenBlackListRepo, updateUserPassword } from "../repository/auth.repo.js";
import type { Auth } from "../validate/auth.validate.js";
import JWT, { type JwtPayload } from "jsonwebtoken";
import { EnvConfig } from "../config/env.config.js";
import { AppError } from "../errors/AppErrors.errors.js";
import type { Types } from "mongoose";
import { sendEmail } from "../middleware/sendEmail.js";
import {
  createPasswordResetToken,
  deleteOtpVerification,
  deletePasswordResetToken,
  findOtpVerification,
  findPasswordResetToken,
  incrementOtpAttempts,
  replaceOtpVerification,
} from "../repository/verification.repo.js";
import {
  createOtp,
  createResetToken,
  getExpiryDate,
  hashVerificationValue,
  MAX_OTP_ATTEMPTS,
  OTP_EXPIRY_MINUTES,
  RESET_TOKEN_EXPIRY_MINUTES,
} from "../utility/verification.utility.js";
import type { VerificationPurpose } from "../models/verification.model.js";



export const genToken = (id:Types.ObjectId|string)=>{
  return JWT.sign({id}, EnvConfig.JWT_SECRET, { expiresIn: "7d" })
}


export const RegisterUser = async (data: Auth.SignUp) => {


  const userExists = await findUser(data.userName);
  if (userExists) throw new AppError("User already esists.",409);

  const hashed = await hashPassword(data.password);

  const userData = {
    userName: data.userName,
    email: data.email,
    password: hashed,
  };
  const user = await createUser(userData);

  const token = genToken(user._id);

  const FinalUserData = {
    userName: user.userName,
    email: user.email,
    token,
  };
  return FinalUserData;
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

// Keep the email wording in one place so registration and recovery use the same OTP policy.
const sendOtpEmail = async (email: string, otp: string, purpose: VerificationPurpose) => {
  const subject = purpose === "registration" ? "Verify your account" : "Reset your password";
  const action = purpose === "registration" ? "complete your registration" : "reset your password";

  await sendEmail({
    to: email,
    subject,
    html: `<p>Use this OTP to ${action}:</p><p><strong>${otp}</strong></p><p>This code expires in ${OTP_EXPIRY_MINUTES} minutes.</p>`,
  });
};

export const requestRegistrationOtp = async (data: Auth.SignUp) => {
  const email = normalizeEmail(data.email);
  const [existingUserName, existingEmail] = await Promise.all([
    findUser(data.userName),
    findUserByEmail(email),
  ]);

  if (existingUserName) throw new AppError("User already exists.", 409);
  if (existingEmail) throw new AppError("Email is already registered.", 409);

  const otp = createOtp();
  const hashedPassword = await hashPassword(data.password);
  // Keep the pending registration separate until the email owner proves possession.
  await replaceOtpVerification({
    email,
    userName: data.userName,
    password: hashedPassword,
    purpose: "registration",
    otpHash: hashVerificationValue(otp),
    expiresAt: getExpiryDate(OTP_EXPIRY_MINUTES),
  });
  await sendOtpEmail(email, otp, "registration");
};

// Shared OTP verification enforces expiry and the maximum number of failed attempts.
const verifyOtp = async (email: string, otp: string, purpose: VerificationPurpose) => {
  const verification = await findOtpVerification(email, purpose);
  if (!verification || verification.expiresAt.getTime() <= Date.now()) {
    throw new AppError("Invalid or expired OTP.", 400);
  }
  if (verification.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError("Too many incorrect OTP attempts.", 429);
  }
  if (verification.otpHash !== hashVerificationValue(otp)) {
    await incrementOtpAttempts(verification._id.toString());
    throw new AppError("Invalid or expired OTP.", 400);
  }
  return verification;
};

export const verifyRegistrationOtp = async (data: Auth.VerifyOtp) => {
  const verification = await verifyOtp(data.email, data.otp, "registration");
  if (!verification.userName || !verification.password) {
    throw new AppError("Registration verification data is incomplete.", 500);
  }

  const user = await createUser({
    userName: verification.userName,
    email: verification.email,
    password: verification.password,
  });
  await deleteOtpVerification(verification._id.toString());

  return { userName: user.userName, email: user.email, token: genToken(user._id) };
};

export const requestPasswordResetOtp = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  const user = await findUserByEmail(normalizedEmail);
  if (!user) return;

  const otp = createOtp();
  await replaceOtpVerification({
    email: normalizedEmail,
    purpose: "password-reset",
    otpHash: hashVerificationValue(otp),
    expiresAt: getExpiryDate(OTP_EXPIRY_MINUTES),
  });
  await sendOtpEmail(normalizedEmail, otp, "password-reset");
};

export const verifyPasswordResetOtp = async (data: Auth.VerifyOtp) => {
  // The raw token is returned once; only its hash is persisted in MongoDB.
  const verification = await verifyOtp(data.email, data.otp, "password-reset");
  const resetToken = createResetToken();
  await createPasswordResetToken({
    email: verification.email,
    tokenHash: hashVerificationValue(resetToken),
    expiresAt: getExpiryDate(RESET_TOKEN_EXPIRY_MINUTES),
  });
  await deleteOtpVerification(verification._id.toString());
  return resetToken;
};

export const resetPassword = async (data: Auth.ResetPassword) => {
  const tokenHash = hashVerificationValue(data.resetToken);
  const resetRecord = await findPasswordResetToken(tokenHash);
  if (!resetRecord || resetRecord.expiresAt.getTime() <= Date.now()) {
    throw new AppError("Invalid or expired reset token.", 400);
  }

  const password = await hashPassword(data.newPassword);
  await updateUserPassword(resetRecord.email, password);
  await deletePasswordResetToken(resetRecord._id.toString());
};

export const signInUser = async (data: Auth.SignIn) => {
  const user = await findUser(data.userName, true);

  if (!user) { throw new AppError("Incorrect username/passwrod", 401) }
  if (!user.password) { throw new AppError("Incorrect username/passwrod", 401) }
  const validate = await verifyPassword(data.password, user.password)

  if (!validate) { throw new AppError("Incorrect username/password", 401) }

  const token = genToken(user._id)

  return {
    userName: user.userName,
    email: user.email,
    token
  }
}

export const tokenBlackListService = async (data: string) => {
  const DecodedToken = JWT.decode(data) as JwtPayload
  if (!DecodedToken || typeof DecodedToken.exp !== "number" || typeof DecodedToken.iat !== "number") {
    throw new AppError("Unotherize Access", 401)
  }

  const tokenData = {
    token: data,
    expiresAt: new Date(DecodedToken.exp * 1000),
    createdAt: new Date(DecodedToken.iat * 1000)
  }

  return await tokenBlackListRepo(tokenData)


}
