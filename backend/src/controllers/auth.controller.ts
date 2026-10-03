import { EnvConfig } from "../config/env.config.js";
import { type Auth } from "../validate/auth.validate.js";
import type { NextFunction, Request, Response } from "express";
import {
  requestPasswordResetOtp,
  requestRegistrationOtp,
  resetPassword,
  signInUser,
  tokenBlackListService,
  verifyPasswordResetOtp,
  verifyRegistrationOtp,
} from "../service/auth.services.js";
import { logger } from "../utility/logger.utility.js";

const cookie = (res: Response, token: string) => {
  return res.cookie("token", token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// Starts registration by sending an OTP; the account is created only after verification.
export const SignUpController = async (
  req: Request<{}, {}, Auth.SignUp>,
  res: Response,
  _next: NextFunction,
) => {
  await requestRegistrationOtp(req.body);
  return res.status(201).json({
    msg: "OTP sent. Verify your email to complete registration.",
  });
};

// Completes registration and creates the authenticated session after a valid OTP.
export const verifyRegistrationOtpController = async (
  req: Request<{}, {}, Auth.VerifyOtp>,
  res: Response,
) => {
  const user = await verifyRegistrationOtp(req.body);
  cookie(res, user.token);
  return res
    .status(201)
    .json({
      msg: "Registration completed.",
      user: { userName: user.userName, email: user.email },
    });
};

// Starts password recovery without revealing whether an email belongs to an account.
export const forgotPasswordController = async (
  req: Request<{}, {}, Auth.ForgotPassword>,
  res: Response,
) => {
  await requestPasswordResetOtp(req.body.email);
  return res
    .status(200)
    .json({ msg: "If that email is registered, an OTP has been sent." });
};

// Exchanges a valid password-reset OTP for a temporary reset token.
export const verifyForgotPasswordOtpController = async (
  req: Request<{}, {}, Auth.VerifyOtp>,
  res: Response,
) => {
  const resetToken = await verifyPasswordResetOtp(req.body);
  return res.status(200).json({ msg: "OTP verified.", resetToken });
};

// Consumes the temporary reset token and stores the newly hashed password.
export const resetPasswordController = async (
  req: Request<{}, {}, Auth.ResetPassword>,
  res: Response,
) => {
  await resetPassword(req.body);
  return res.status(200).json({ msg: "Password reset successfully." });
};

export const SignInController = async (
  req: Request<{}, {}, Auth.SignIn>,
  res: Response,
  next: NextFunction,
) => {
  const user = await signInUser(req.body);

  cookie(res, user.token);

  return res.status(200).json({
    msg: "User SignIn Sucessfully.",
    user: {
      userName: user.userName,
    },
  });
};

export const signOutController = async (req: Request, res: Response) => {
  const token = req.cookies.token;
  if (token) {
    try {
      await tokenBlackListService(token);
    } catch (err) {
      logger.warn(err, "Failed to blacklist token during signout:");
    }
  }
  res.clearCookie("token");
  return res.status(200).json({
    msg: "LogOut Sucessfully",
  });
};
