import { Router } from "express";
import { SignUpController, SignInController, signOutController, } from "../controllers/auth.controller.js";
import { AuthSchema } from "../validate/auth.validate.js";
import { validate } from "../middleware/validate.middleware.js";

import { authRateLimit } from "../middleware/ratelimiter.middleware.js";


const authRouter = Router();

authRouter.post('/signUp',authRateLimit ,validate(AuthSchema.signUp),SignUpController);
authRouter.post('/signIn', authRateLimit,validate(AuthSchema.signIn),SignInController);
authRouter.get('/signOut',signOutController);




export default authRouter;