import {BaseRevokeTokenKey, deleteKey, findKeys, revokeTokenKey, set} from "../../common/services/redis.service.js"
import {decrypt } from "../../common/utils/security/encryption.js";
import { createLoginCredientials } from "../../common/utils/security/token.js";
import { compareHash, generateHash } from "../../common/utils/security/hash.js";
import { create, deleteMany, findOne } from "../../DB/db.service.js";
import { userModel } from "../../DB/model/user.model.js";

export const profile = async (user) => {
  return user;
};

export const profileImage = async (file, user) => {
  user.profilePic = file.finalPath;
  await user.save();
  return user;
};
export const coverImage = async (file, user) => {
  user.coverPics = file.map((ele) => ele.finalPath);
  await user.save();
  return user;
};
export const logout = async ({ flag }, user, { jti, iat ,sub}) => {
  let status = 200;
  switch (flag) {
    case "all":
      user.changeCredentialsTime = new Date();
      await user.save();
      await deleteKey(await findKeys(BaseRevokeTokenKey(sub)))
      break;
    case "one":
      set({key:revokeTokenKey({userId:sub , jti}), value:jti  , ttl:370000})
      status = 201;
      break;
      default:
        throw new Error("enter one or all"); 
  }
  return status;
};

export const shareProfile = async(userId )=>{
  const user = await findOne({model:userModel , filter:{_id:userId} , select:"-password -role "})
  if (!user) {
    throw new Error("User not found");
  }
  if (user.phone) {
    user.phone = decrypt(user.phone)
  }
  return user
}

export const rotate = async (user , {jti ,sub, iat}) => {
  if ((iat+3*60*60) *1000 >Date.now()) {
    throw new Error("current access token still valid")
  }
  // blacklist للتوكن القديم عشان يبقي الجديد بس هو اللي شغال
  await set({
    key:revokeTokenKey({userId:sub , jti}),
    value:jti,
    ttl:37000
  })
  return await createLoginCredientials(user);
}
/////////////////////////////////////////////////////////////////////////////
export const updatePassword = async ({newPassword , oldPassword} , user) => {
  if (!await compareHash(oldPassword , user.password)) {
    throw new Error("old password wrong");
  }
  user.password = await generateHash(newPassword)
  user.changeCredentialsTime = new Date()
  await user.save()
  return 
};







