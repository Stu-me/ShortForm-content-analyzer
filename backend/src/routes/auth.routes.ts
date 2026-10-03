import { Router } from "express";
import {
	forgotPasswordController,
	resetPasswordController,
	SignInController,
	SignUpController,
	signOutController,
	verifyForgotPasswordOtpController,
	verifyRegistrationOtpController,
} from "../controllers/auth.controller.js";
import { AuthSchema } from "../validate/auth.validate.js";
import { validate } from "../middleware/validate.middleware.js";

import { authRateLimit } from "../middleware/ratelimiter.middleware.js";


const authRouter = Router();

// Registration is split into requesting an OTP and completing the account after verification.
authRouter.post('/signUp',authRateLimit ,validate(AuthSchema.signUp),SignUpController);
authRouter.post('/signUp/verify', authRateLimit, validate(AuthSchema.verifyRegistrationOtp), verifyRegistrationOtpController);
authRouter.post('/signIn', authRateLimit,validate(AuthSchema.signIn),SignInController);

// Password recovery first verifies ownership of the email, then accepts a short-lived reset token.
authRouter.post('/forgot-password', authRateLimit, validate(AuthSchema.forgotPassword), forgotPasswordController);
authRouter.post('/forgot-password/verify', authRateLimit, validate(AuthSchema.verifyForgotPasswordOtp), verifyForgotPasswordOtpController);
authRouter.post('/forgot-password/reset', authRateLimit, validate(AuthSchema.resetPassword), resetPasswordController);
authRouter.get('/signOut',signOutController);




export default authRouter;