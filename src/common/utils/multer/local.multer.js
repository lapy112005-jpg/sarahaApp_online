import multer from "multer"
import path, { resolve } from "path"
import {randomUUID} from "crypto"
import { existsSync, mkdirSync } from "fs"
import { fileFilter } from "./validition.multer.js"
export const localFileUpload = ({custumPath , validition=[] , maxSize=5})=>{
    const storage = multer.diskStorage({
        destination:function(req,file,cb){
            const fullPath = resolve(`./uploads/${custumPath}`)     
            if (!existsSync(fullPath)) {
                mkdirSync(fullPath , {recursive:true})
            }
            cb(null,path.resolve(fullPath ))
        },
        filename:function(req,file,cb){
            const uniqueFileName = randomUUID() +"_"+ file.originalname
            file.finalPath = `uploads/${custumPath}/${uniqueFileName}`
            cb(null,uniqueFileName)
        }
    })
    return multer({fileFilter:fileFilter(validition) , storage })
}




