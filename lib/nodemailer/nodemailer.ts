import nodemailer, { Transporter } from "nodemailer";

export default function nodemailerFn(
  msg: string,
  email: string,
  subject: string,
  text: string
): void {
  const transporter: Transporter = nodemailer.createTransport({
    host: "email-smtp.us-east-1.amazonaws.com",
    port: 465,
    secure: true,
    auth: {
      // add this to .env. Back up in Google drive.
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
    tls: {
      rejectUnauthorized: false, // no SSL present on domain. That's the reason for this.
    },
  });

  async function main() {
    const info = await transporter.sendMail({
      from: '"KDN Team" <support@kdnplus.com>',
      to: email,
      subject: subject,
      text: text,
      html: msg,
    });

    // console.log("Message sent: %s", info.messageId);
  }

  main().catch(console.error);
}
