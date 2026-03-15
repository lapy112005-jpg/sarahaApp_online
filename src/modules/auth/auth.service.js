import { userModel } from "../../DB/model/user.model.js";
import { create, findOne } from "../../DB/db.service.js";
import { compareHash, generateHash } from "../../common/utils/security/hash.js";
import { encrypt } from "../../common/utils/security/encryption.js";
import { createLoginCredientials } from "../../common/utils/security/token.js";
import { sendEmail } from "../../common/utils/email/send.email.js";
import { OAuth2Client } from "google-auth-library";
import { providerEnum } from "../../common/enums/user.enum.js";
import { create_OTP } from "../../common/utils/email/otp.js";
import {
  deleteKey,
  findKeys,
  get,
  set,
  simpleSet,
  ttl,
  update,
} from "../../common/services/redis.service.js";
import { emailEmmiter } from "../../common/email.event.js";


export const generate_Key_inRadis_And_SendEmail = async ({keyName,email,subject}) => {
  const code = `${await create_OTP()}`;
  const attemptsKey = `attempts_for:${email}`;
  const attemptsValue = Number(await get({ key: attemptsKey }) || 0)
  if (attemptsValue >= 3) {
    throw new Error(`Much attempts reached try again after ${await ttl({key:attemptsKey})} seconds`);
  }
  await simpleSet({keyName: attemptsKey, value: attemptsValue + 1,ttl: 600});
  await set({ keyName, value: await generateHash(code), ttl: 200 });
  emailEmmiter.emit("confirm_email", {
    to: email,
    subject,
    code,
  });
};
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
export const signup = async ({email , password , phone , username}) => {
  const checkUserExist = await findOne({
    model: userModel,
    filter: { email },
  });
  if (checkUserExist) {
    throw new Error("email already exist");
  }
  const user = await create({
    model: userModel,data: {email, password: await generateHash(password), username, phone: await encrypt(phone)},
  });
  await generate_Key_inRadis_And_SendEmail({
    keyName: `signup_otp:${email}`,
    email,
    subject: "SIGNUP OTP",
  });
  return user;
};
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
export const confirmEmail = async ({email , otp}) => {
  const checkUserExist = await findOne({ model: userModel, filter: {  email, confirmEmail: { $exists: false }, provider: providerEnum.system,},});
  if (!checkUserExist) {
    throw new Error("fail to finding matching account or your acc already confirmed",);
  }
  const hashed_OTP_in_radis = await get({ key: `signup_otp:${email}` });
  if (!hashed_OTP_in_radis) {
    throw new Error("otp expired");
  }
  if (!await compareHash(otp, hashed_OTP_in_radis)) {
    throw new Error("invalid otp .. ");
  }
  checkUserExist.confirmEmail = new Date();
  await checkUserExist.save();
  await deleteKey([ `signup_otp:${email}`,`attempts_for:${email}` ]);
  return "your email confirmed";
};
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
export const resendConfirmEmail = async ({email}) => {
  const checkUserExist = await findOne({
    model: userModel,
    filter: {
      email,
      confirmEmail: { $exists: false },
      provider: providerEnum.system,
    },
  });
  if (!checkUserExist) {
    throw new Error("fail to finding matching account or your acc already confirmed");
  }
  const hashed_OTP_in_radis = await get({ key:`signup_otp:${email}` });
  if (hashed_OTP_in_radis) {
    throw new Error(`you cant get another code after ${ await ttl({key:`signup_otp:${email}`})}`);
  }
  await generate_Key_inRadis_And_SendEmail({keyName: `signup_otp:${email}`, email, subject: "RESEND OTP CODE"});
  return;
};
//////////////////////////////////////////////////////////////////////////
export const forgetPassword = async({email})=>{
  const checkUserExist = await findOne({model:userModel , filter:{email , confirmEmail:{$exists:true}}})
  if (!checkUserExist) {
    throw new Error("email is not exist");
  }
  const hashedOTP = await get({key:`forgetPasswordOtp:${email}`})
  if (hashedOTP) {
    throw new Error(`you can request new code after ${await ttl({key:`forgetPasswordOtp:${email}`})}`);
  }
  await generate_Key_inRadis_And_SendEmail({keyName:`forgetPasswordOtp:${email}`,email,subject:"FORGET PASSOWRD OTP"})
  return "otp sent ..............check your email "
}
////////////////////////////////////////////////////////////////////////////////
export const confirmForgetPassword =async({email , otp})=>{
  const checkUserExist = await findOne({model:userModel , filter:{email , confirmEmail:{$exists:true}}})
  if (!checkUserExist) {
    throw new Error("email is not exist");
  }
  const hashedOTP = await get({key:`forgetPasswordOtp:${email}`})
  if (!hashedOTP) {
    throw new Error("otp expired");
  }
  if (!await compareHash(otp ,hashedOTP)) {
    throw new Error("wrong otp ");
  }
  return "confirmed"
}
///////////////////////////////////////////////////////////////////////////////////
export const resetPassword =async({email , newPassword, otp})=>{
  await confirmForgetPassword({email , otp})
  const checkUserExist = await findOne({model:userModel , filter:{email , confirmEmail:{$exists:true}}})
  if (!checkUserExist) {
    throw new Error("email is not exist");
  }
  checkUserExist.password = await generateHash(newPassword)
  checkUserExist.changeCredentialsTime = new Date()
  await checkUserExist.save()
  await deleteKey([`forgetPasswordOtp:${email}` , `attempts_for:${email}`])
  return "password updated successfully"
}
//login
export const login = async ({email , password}) => {
  const findUser = await findOne({model: userModel,filter: {email, confirmEmail: { $exists: true } }});
  if (!findUser) {
    throw new Error("email is wrong");
  }
  const matchPassword = await compareHash(password, findUser.password);
  if (!matchPassword) {
    throw new Error("password is wrong");
  }
  await generate_Key_inRadis_And_SendEmail({
    keyName: `login_otp${email}`,
    email,
    subject: "LOGIN OTP FROM OUR COMPANY",
  });
  return "otp send to your email";
};

export const confirmLogin = async ({email , otp}) => {
  const findUser = await findOne({
    model: userModel,
    filter: { email, confirmEmail: { $exists: true } },
  });
  if (!findUser) {
    throw new Error("email is wrong");
  }
  const hashedOtp = await get({ key: `login_otp${email}` });
  if (!hashedOtp) {
    throw new Error("otp expired");
  }
  const matchOTP = await compareHash(otp, hashedOtp);
  if (!matchOTP) {
    throw new Error("otp is wrong");
  }
  await deleteKey([`login_otp${email}` , `attempts_for:${email}`]);
  return await createLoginCredientials(findUser);
};


//////////////////////////////////////////////////////////////////////////////
//verify the google token that coming from frontend
export const verifyGoogleAccount = async ({ idToken }) => {
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience:
      "224591947494-d6qaakhta546hrmjcm854o1kglpaqnka.apps.googleusercontent.com",
  });
  const payload = ticket.getPayload();
  if (!payload.email_verified) {
    throw new Error("fail to authenticate this account with google");
  }
  return payload;
};

export const loginGmail = async ({ idToken }) => {
  const payload = await verifyGoogleAccount({ idToken });
  const checkUserExist = await findOne({
    model: userModel,
    filter: { email: payload.email, provider: providerEnum.google },
  });
  if (!checkUserExist) {
    throw new Error("invalid login credintials or invalid login approach");
  }
  return await createLoginCredientials(checkUserExist);
};

export const signupGmail = async ({ idToken }) => {
  const payload = await verifyGoogleAccount({ idToken });
  const checkUserExist = await findOne({
    model: userModel,
    filter: { email: payload.email },
  });
  if (checkUserExist) {
    if (checkUserExist?.provider == providerEnum.system) {
      throw new Error(
        "go and login with email&password ... this email already exist",
      );
    }
    return await loginGmail({ idToken });
  }
  const user = await create({
    model: userModel,
    data: {
      firstName: payload.given_name,
      lastName: payload.family_name,
      email: payload.email,
      provider: providerEnum.google,
      profilePic: payload.picture,
      confirmEmail: new Date(),
    },
  });
  return await createLoginCredientials(user);
};

