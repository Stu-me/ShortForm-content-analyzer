import { api } from './client'

import type {
  ForgotPasswordInput,
  OtpInput,
  ResetPasswordInput,
  SignInInput,
  SignUpInput,
} from '../validate/auth.validate'

type MessageResponse = { msg: string }

export const authApi = {
  signUp: async (data: SignUpInput) => {
    const res = await api.post<MessageResponse>('/auth/signUp', data)
    return res.data
  },

  verifyRegistrationOtp: async (data: OtpInput) => {
    const res = await api.post<{ msg: string; user: { userName: string; email: string } }>('/auth/signUp/verify', data)
    return res.data
  },

  requestPasswordReset: async (data: ForgotPasswordInput) => {
    const res = await api.post<MessageResponse>('/auth/forgot-password', data)
    return res.data
  },

  verifyPasswordResetOtp: async (data: OtpInput) => {
    const res = await api.post<{ msg: string; resetToken: string }>('/auth/forgot-password/verify', data)
    return res.data
  },

  resetPassword: async (data: ResetPasswordInput) => {
    const res = await api.post<MessageResponse>('/auth/forgot-password/reset', data)
    return res.data
  },


  signIn: async (data: SignInInput) => {
    const res = await api.post<{ msg: string; user: { userName: string } }>('/auth/signIn', data)
    return res.data
  },

  signOut: async () => {

    const res = await api.get<{ msg: string }>('/auth/signOut')
    console.log(res.data)
    return res.data
  },
}
