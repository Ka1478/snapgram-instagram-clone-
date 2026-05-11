import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendResetEmail = async (toEmail, resetLink) => {
  await transporter.sendMail({
    from: `"Snapgram" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset Your Snapgram Password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:10px;">
        <h2 style="color:#6366f1;">Snapgram Password Reset</h2>
        <p>Click the button below — this link expires in <strong>15 minutes</strong>.</p>
        <a href="${resetLink}"
          style="display:inline-block;margin:16px 0;padding:12px 24px;background:#6366f1;color:white;border-radius:8px;text-decoration:none;font-weight:bold;">
          Reset Password
        </a>
        <p style="color:#888;font-size:13px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};