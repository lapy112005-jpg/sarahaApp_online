import { resolve } from "node:path";
import { config } from "dotenv";

export const NODE_ENV = process.env.NODE_ENV;

const envPath = {
  development: `.env.development`,
  production: `.env.production`,
};
console.log({ en: envPath[NODE_ENV] });

config({ path: resolve(`./config/${envPath[NODE_ENV]}`) });

export const port = process.env.PORT ?? 7000;

export const DB_URI = process.env.DB_URI;
export const REDIS_URL = process.env.REDIS_URL;
export const ENC_BYTE = process.env.ENC_BYTE;

export const ADMIN_ACCESS_SECRET_KEY = process.env.ADMIN_ACCESS_SECRET_KEY;
export const ADMIN_REFRESH_SECRET_KEY = process.env.ADMIN_REFRESH_SECRET_KEY;

export const USER_ACCESS_SECRET_KEY = process.env.USER_ACCESS_SECRET_KEY;
export const USER_REFRESH_SECRET_KEY = process.env.USER_REFRESH_SECRET_KEY;

export const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;
export const EMAIL_APP = process.env.EMAIL_APP;


export const SALT_ROUND = parseInt(process.env.SALT_ROUND ?? "10");
console.log({ SALT_ROUND });
