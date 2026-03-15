import mongoose from "mongoose";
import { DB_URI } from "../../config/config.service.js";
import { userModel } from "./model/user.model.js";

export const checkConnection = async () => {
  try {
    await mongoose.connect(DB_URI);
    await userModel.syncIndexes(); //syncoronization indexes (added uniques as indexes when we relode)
    console.log("db connected successfully");
  } catch (error) {
    console.log(`fail to connect with db ${error}`);
  }
};
