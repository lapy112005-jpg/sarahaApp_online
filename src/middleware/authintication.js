import { tokenTypeEnum } from "../common/enums/user.enum.js"
import { decodeToken_And_FindUser } from "../common/utils/security/token.js"

export const auth = (tokenType)=>{
    return async (req , res , next)=>{
        try {
            if (!req.headers.authorization) {
                return res.status(401).json({ message: "Authorization token required" });
            }
            const {user , decoded } = await decodeToken_And_FindUser({token:req.headers.authorization , tokenType_AccessOrRefresh: tokenType})
            req.user = user
            req.decoded = decoded
            next()
        } catch (error) {
            return res.status(401).json({ message: error.message || "Invalid token" });
        }
    }
}
export const authorization = (accessRole)=>{
    return async (req , res , next)=>{
        if (accessRole !== req.user.role) {
            return res.status(403).json({ message: "Access denied" });
        }
        next()
    }
}