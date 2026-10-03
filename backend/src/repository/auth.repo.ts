
import { userModel, blackListModel, type Iuser, type IblackListToken } from "../models/auth.model.js"

// User repository helpers keep account persistence details out of auth services.

export const findUser = async(userName:string,isPassword?:boolean)=>{

    const quary = userModel.findOne({userName});

    return isPassword ? await quary.select("+password") : await quary
    
}

export const findUserByEmail = async (email: string, isPassword = false) => {
    const query = userModel.findOne({ email });
    return isPassword ? await query.select("+password") : await query;
}

export const createUser = async (userData:Partial<Iuser>):Promise<Iuser>=>{
    return await userModel.create(userData);
}

export const updateUserPassword = async (email: string, password: string) => {
    // The service passes an already-hashed password, so this method only persists it.
    return userModel.findOneAndUpdate({ email }, { password }, { new: true }).select("+password");
}

export const tokenBlackListRepo = async (tokenData:Partial<IblackListToken>)=>{
    return await blackListModel.create(tokenData);
}

export const blackListedTokenFinderRepo = async(token:string)=>{
    return blackListModel.findOne({token})
}


