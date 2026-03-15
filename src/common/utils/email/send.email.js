import nodeMailer from "nodemailer";
import { EMAIL_APP, EMAIL_APP_PASSWORD } from "../../../../config/config.service.js";

// export const sendEmail = async () => {

//   const transporter = nodemailer.createTransport({
//     se
//     auth: {
//       user: "maddison53@ethereal.email",
//       pass: "jn7jnAPss4f63QBp6D",
//     },
//   });

//   // Send an email using async/await
//   (async () => {
//     const info = await transporter.sendMail({
//       from: '"Maddison Foo Koch" <maddison53@ethereal.email>',
//       to: "bar@example.com, baz@example.com",
//       subject: "Hello ✔",
//       text: "Hello world?", // Plain-text version of the message
//       html: "<b>Hello world?</b>", // HTML version of the message
//     });

//     console.log("Message sent:", info.messageId);
//   })();
// };
// import nodemailer from "nodemailer";
// import {
//   EMAIL_APP,
//   EMAIL_APP_PASSWORD,
// } from "../../../../config/config.service.js";

export const sendEmail = async ({to,cc,bcc,subject,html,attachments = [],
}) => {
  const transporter = nodeMailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_APP,
      pass: EMAIL_APP_PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `"SarahaApp" <${EMAIL_APP}>`,
    to,
    cc,
    bcc,
    subject,
    html,
    attachments,
  });

  console.log("Message sent:", info.messageId);
};
