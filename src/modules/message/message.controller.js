import { Router } from "express";
import { deleteMessageById, getMessage, messages_i_send, myMessages, sendMessage, sendMessageWithSender } from "./message.service.js";
import { localFileUpload } from "../../common/utils/multer/local.multer.js";
import { allowedFiles } from "../../common/utils/multer/validition.multer.js";
import { validition } from "../../middleware/validition.middleware.js";
import { message_schema } from "./message.validition.js";
import { auth } from "../../middleware/authintication.js";
const router = Router({caseSensitive:true , strict:true , mergeParams:true});

router.post(
  "/send-message/:receiverid",
  localFileUpload({
    custumPath: "messages",
    validition: allowedFiles.image,
  }).array("attachments", 2),
  validition(message_schema),
  async (req, res, next) => {
    const result =await sendMessage(req.params.receiverid, req.files, req.body);
    res.json({ message: "done", result });
  },
);

router.post(
  "/send-message/:receiverid/by-user",
  auth(),
  localFileUpload({
    custumPath: "messages",
    validition: allowedFiles.image,
  }).array("attachments", 2),
  validition(message_schema),
  async (req, res, next) => {
    const result =await sendMessageWithSender(req.params.receiverid, req.files, req.body , req.user);
    res.json({ message: "done", result });
  },
);

router.get("/get-message/:id" ,auth(), async(req,res,next)=>{
  const result = await getMessage(req.params.id , req.user)
  res.json({result})
})
router.delete("/delete-message/:id" ,auth(), async(req,res,next)=>{
  const result = await deleteMessageById(req.params.id  , req.user)
  res.json({result})
})
router.get("/my-messages" ,auth(), async(req,res,next)=>{
  const result = await myMessages(req.user)
  res.json({result})
})
router.get("/messages-i-send" ,auth(), async(req,res,next)=>{
  const result = await messages_i_send(req.user)
  res.json({result})
})

export default router;
