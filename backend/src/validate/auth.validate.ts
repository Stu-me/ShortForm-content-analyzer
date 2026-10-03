import { z } from "zod";

// Shared validation rules keep registration, sign-in, and password reset consistent.
const USERNAME_RULE = z
    .string()
    .min(3, "Too Short!")
    .max(10)
    .regex(/^[a-zA-Z0-9]+$/, { message: "Special characters are not allowed" })

const PASS_RULE = z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(50, 'Password cannot exceed 50 characters') 
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');


const SignUpSchema = z.object({
  userName: USERNAME_RULE,
  email: z.email("Invalid Email"),
  password: PASS_RULE
});

const SignInSchema = z.object({
    userName: USERNAME_RULE,
  password: PASS_RULE
});

const VerifyOtpSchema = z.object({
  email: z.email("Invalid Email"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be a 6-digit number"),
});

const ForgotPasswordSchema = z.object({
  email: z.email("Invalid Email"),
});

const ResetPasswordSchema = z.object({
  resetToken: z.string().min(1, "Reset token is required"),
  newPassword: PASS_RULE,
});

export const AuthSchema = {
  signUp:SignUpSchema,
  signIn: SignInSchema,
  verifyRegistrationOtp: VerifyOtpSchema,
  forgotPassword: ForgotPasswordSchema,
  verifyForgotPasswordOtp: VerifyOtpSchema,
  resetPassword: ResetPasswordSchema,
}

export namespace Auth {
  export type SignUp = z.infer<typeof SignUpSchema>
  export type SignIn = z.infer<typeof SignInSchema>
  export type VerifyOtp = z.infer<typeof VerifyOtpSchema>
  export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>
  export type ResetPassword = z.infer<typeof ResetPasswordSchema>
}
