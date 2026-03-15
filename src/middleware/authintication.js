import { tokenTypeEnum } from "../common/enums/user.enum.js"
import { decodeToken_And_FindUser } from "../common/utils/security/token.js"

export const auth = (tokenType)=>{
    return async (req , res , next)=>{
    const {user , decoded } = await decodeToken_And_FindUser({token:req.headers.authorization , tokenType_AccessOrRefresh: tokenType})
    req.user = user
    req.decoded = decoded
    next()
    }
}
export const authorization = (accessRole)=>{
    return async (req , res , next)=>{
        if (accessRole!=req.user.role) {
            throw new Error("not allowed account")
        }
        next()
    }
}