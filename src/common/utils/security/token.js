import jwt from "jsonwebtoken";
import {
  ADMIN_ACCESS_SECRET_KEY,
  ADMIN_REFRESH_SECRET_KEY,
  USER_ACCESS_SECRET_KEY,
  USER_REFRESH_SECRET_KEY,
} from "../../../../config/config.service.js";
import { providerEnum, roleEnum, tokenTypeEnum } from "../../enums/user.enum.js";
import { findOne } from "../../../DB/db.service.js";
import { userModel } from "../../../DB/model/user.model.js";
import { randomUUID } from "node:crypto";
import { get, revokeTokenKey } from "../../services/redis.service.js";
//just generate token
export const generateToken = async ({payload = {},secret , options = {},
}) => {
  return jwt.sign(payload, secret, options);
};

//just verify token
export const verifyToken = async ({ token: token, secret: secret }) => {
  return jwt.verify(token, secret);
};

//knowing secretKey according to ROLE(admin or user)
export const getTokenSecret = async (role) => {
  let accessSignature;
  let refreshSignature;
  switch (role) {
    case roleEnum.Admin:
      accessSignature = ADMIN_ACCESS_SECRET_KEY;
      refreshSignature = ADMIN_REFRESH_SECRET_KEY;
      break;
    default:
      accessSignature = USER_ACCESS_SECRET_KEY;
      refreshSignature = USER_REFRESH_SECRET_KEY;
      break;
  }
  return { accessSignature, refreshSignature };
}; 

//create login credentials
export const createLoginCredientials = async (foundUser) => {
  const { accessSignature, refreshSignature } = await getTokenSecret(foundUser.role); 
  const jwtid = randomUUID()
  const access_token = await generateToken({payload: {
      sub: foundUser._id,
      role: foundUser.role,
      aud: [tokenTypeEnum.access, providerEnum.system],
      jti: jwtid  
    },
    secret: accessSignature,
    options: { expiresIn: "3h" },
  });
  const refresh_token = await generateToken({
    payload: {
      sub: foundUser._id,
      role: foundUser.role,
      aud: [tokenTypeEnum.refresh, providerEnum.system],
      jti: jwtid  
    },
    secret: refreshSignature,
    options: { expiresIn: "1y" },
  });
  return { access_token, refresh_token };
};
//=======================================================




export const decodeToken_And_FindUser = async ({token , tokenType_AccessOrRefresh=tokenTypeEnum.access }) => {
  const decoded = jwt.decode(token);
  if (!decoded?.aud) {
    throw new Error("no audience");
  }
  const [Secret_Type_From_Audience , Provider_Type_From_Audience] = decoded.aud;
  if (Secret_Type_From_Audience !== tokenType_AccessOrRefresh) {
    throw new Error(`invalid token type of ${Secret_Type_From_Audience} it musst be ${tokenType_AccessOrRefresh}`);
  }
  if (decoded.jti && await get({key:revokeTokenKey({userId:decoded.sub , jti:decoded.jti})})) {
    throw new Error("this token is revoked in database== you cant login by it");
  }
  const { accessSignature, refreshSignature } = await getTokenSecret(
    decoded.role,
  );
  
  const verified = await verifyToken({
    token,
    secret:
      tokenType_AccessOrRefresh === tokenTypeEnum.refresh ? refreshSignature : accessSignature,  //if someone send refresh token it will be okay here so we use audiene to check before this line
  });
  
  const user = await findOne({model:userModel , filter:{_id:verified.sub}})
  if (!user) {
    throw new Error("user not found");
  }

  if (user.changeCredentialsTime && user.changeCredentialsTime.getTime() >=decoded.iat*1000) {
    throw new Error("this token logged out from all devices because changeCredentials is updated means this toked logged out from all");
  }
  return {user , decoded}
};
