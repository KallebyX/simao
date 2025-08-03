"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendMail = SendMail;
const nodemailer_1 = __importDefault(require("nodemailer"));
async function SendMail(mailData) {
    const options = {
        host: process.env.MAIL_HOST,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    };
    const transporter = nodemailer_1.default.createTransport(options);
    let info = await transporter.sendMail({
        from: process.env.MAIL_FROM,
        to: mailData.to,
        subject: mailData.subject,
        text: mailData.text,
        html: mailData.html || mailData.text
    });
    console.log("Message sent: %s", info.messageId);
    console.log("Preview URL: %s", nodemailer_1.default.getTestMessageUrl(info));
}
//# sourceMappingURL=SendMail.js.map