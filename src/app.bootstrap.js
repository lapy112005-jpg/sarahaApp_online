import { NODE_ENV, port } from "../config/config.service.js";
import { checkConnection } from "./DB/connection.db.js";
import { authRouter, messageRouter, userRouter } from "./modules/index.js";
import express from "express";
import cors from "cors";
import { resolve } from "path";
import { redisClient, redisConnection } from "./DB/redis.connection.js";
import { findKeys } from "./common/services/redis.service.js";
import helmet from "helmet";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import axios from "axios";
import geoip from "geoip-lite";

async function bootstrap() {
  const app = express();
  const fromWhere = async (ip) => {
      const geo = geoip.lookup(ip);
      return geo;
  };
  const limiter = rateLimit({
    windowMs: 2 * 60 * 1000,
    skipFailedRequests:true,
    limit: async function (req) {
      // const { country } = await fromWhere(req.ip);
      // if (country === "EG") {
        return 10;
      // } else {
      //   return 3;
      // }
    },
    keyGenerator: (req, res, next) => {
      const ip = ipKeyGenerator(req.ip, 56);
      return `${ip}-${req.path}`;
    },
    store: {
    async incr(key, cb) { // get called by keyGenerator
      try {
        const count = await redisClient.incr(key);
        if (count === 1) await redisClient.expire(key, 120); // 2 min TTL
        cb(null, count);
      } catch (err) {
        cb(err);
      }
    },
 
    async decrement(key) {  // called by kipFailedRequests:true ,  skipSuccessfulRequests:true,
      await redisClient.decr(key);
    },
  }
  });
  app.set("trust proxy", true);
  app.use(cors(), helmet(), limiter, express.json());
  //db
  await checkConnection();
  await redisConnection();
  //application routing
  app.get("/", async (req, res) => {
    console.log(await fromWhere(req.ip));

    res.send("Hello World!");
  });
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/message", messageRouter);
  app.use("/uploads", express.static(resolve("../uploads/")));

  //invalid routing
  app.use("{/*dummy}", (req, res) => {
    return res.status(404).json({ message: "Invalid application routing" });
  });

  //error-handling
  app.use((error, req, res, next) => {
    const status = error.cause?.status ?? 500;
    return res.status(status).json({
      error_message:
        status === 500
          ? "something went wrong"
          : (error.message ?? "something went wrong"),

      details: error.cause?.details,

      stack: NODE_ENV === "development" ? error.stack : undefined,
    });
  });

  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
}
export default bootstrap;

// const whiteList = [
//   "http://127.0.0.1:5500",
//   "http://127.0.0.1:4200",
//   undefined,
// ];
// var corsOptions = {
//   origin: function (origin, callback) {
//     if (!whiteList.includes(origin)) {
//       callback(new Error("not authorized origin"));
//     } else {
//       callback(null, true);
//     }
//   },
// };
