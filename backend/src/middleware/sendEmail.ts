import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

const { EMAIL_USER, EMAIL_PASS, EMAIL_FROM } = process.env;

if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_FROM) {
  throw new Error("Missing email environment variables.");
}

// Brevo's SMTP relay uses port 2525 because some hosting providers block port 587.
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 2525,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Verify the SMTP connection during startup so configuration errors are visible early.
transporter.verify((error) => {
  if (error) {
    console.error("SMTP Connection Error:", error);
  } else {
    console.log("SMTP Mailer initialized successfully!");
  }
});

export const sendEmail = async ({ to, subject, html }: EmailMessage) => {
  try {
    console.log("Sending email to:", to);

    const info = await transporter.sendMail({
      from: `"Content Analyzer" <${EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    console.log("Email sent successfully:", info.messageId);

    return info;
  } catch (error: unknown) {
    console.error("Email Error:", error);
    throw error;
  }
};