import { create, deleteOne, find, findOne } from "../../DB/db.service.js"
import { messageModel } from "../../DB/model/message.model.js";
import { userModel } from "../../DB/model/user.model.js"




export const sendMessage =  async(receiverid , files=[] ,{content})=>{
    const checkReceiverExist = await findOne({model:userModel , filter:{_id:receiverid , confirmEmail:{$exists:true}}})
    if (!checkReceiverExist) {
        throw new Error("no matching account");
    }
    const message = await create({model:messageModel , data:{content , attachments:files.map(ele=> ele.finalPath)  , receiverid} })
    return message
}

export const sendMessageWithSender =  async(receiverid , files=[] ,{content} ,user )=>{
    const checkReceiverExist = await findOne({model:userModel , filter:{_id:receiverid , confirmEmail:{$exists:true}}})
    if (!checkReceiverExist) {
        throw new Error("no matching account");
    }
    const message = await create({model:messageModel , data:{content , attachments:files.map(ele=> ele.finalPath)  , receiverid , senderId:user._id} })
    return message
}

export const getMessage =  async(messageId , user)=>{
    const message = await findOne({model:messageModel , filter:{_id:messageId , $or:[{senderId:user._id} , {receiverid:user._id}]} , select:"-senderId"})
    if (!message) {
        throw new Error("no matching message");
    }
    return message
}
export const deleteMessageById =  async(messageId , user)=>{
    const message = await deleteOne({model:messageModel , filter:{_id:messageId , receiverid:user._id}})
    if (!message.deletedCount) {
        throw new Error("no matching message");
    }
    return message
}
export const myMessages =  async(user)=>{
    const messages = await find({model:messageModel , filter:{receiverid:user._id}})
    return messages
}
export const messages_i_send =  async(user)=>{
    const messages = await find({model:messageModel , filter:{senderId:user._id}})
    return messages
}