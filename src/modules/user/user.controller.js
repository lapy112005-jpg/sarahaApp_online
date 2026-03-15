import { Router } from "express";
import { coverImage, logout, profile, profileImage, rotate, shareProfile, updatePassword } from "./user.service.js";
import { auth, authorization } from "../../middleware/authintication.js";
import { roleEnum, tokenTypeEnum } from "../../common/enums/user.enum.js";
import { localFileUpload } from "../../common/utils/multer/local.multer.js";
import { allowedFiles } from "../../common/utils/multer/validition.multer.js";
import { validition } from "../../middleware/validition.middleware.js";
import { update_Password_Schema, ValidateCoverImages_schema, ValidateProfileImage_schema } from "./user.validition.js";

const router = Router();
//profile
router.get(
  "/profile",
  auth(),
  authorization(roleEnum.user),
  async (req, res, next) => {
    const result = await profile(req.user);
    return res.status(200).json({ message: "done", result });
  },
);

router.patch("/profile-image",auth(),localFileUpload({
  custumPath: "profilePics",
  validition: allowedFiles.image,
  }).single("attachment"),
  validition(ValidateProfileImage_schema),
  async (req, res, next) => {
    const account = await profileImage(req.file, req.user);
    return res.status(200).json({ account });
  },
);
router.patch(
  "/profile-cover-image",
  auth(),
  localFileUpload({
    custumPath: "coverPics",
    validition: allowedFiles.image,
  }).array("attachments",5), 
    validition(ValidateCoverImages_schema),  
    async (req, res, next) => {
      const account = await coverImage(req.files, req.user);
      return res.status(200).json({ account});
  },
);
router.post("/logout" , auth() , async(req,res,next)=>{
  const status = await logout(req.body ,  req.user , req.decoded)
  return res.status(status).json({message:"done"})
})
router.get("/share-profile/:userId" , async(req,res,next)=>{
  const result = await shareProfile(req.params.userId  )
  return res.json({result})
})
router.post("/rotate", auth(tokenTypeEnum.refresh), async (req, res, next) => {
  const result = await rotate(req.user , req.decoded);
  return res.status(200).json({ message: "done", result });
});
router.post("/update-password" , auth() ,validition(update_Password_Schema), async(req,res,next)=>{
  const result = await updatePassword(req.body,req.user )
  return res.status(201).json({message:"done" , result})
})
export default router;
