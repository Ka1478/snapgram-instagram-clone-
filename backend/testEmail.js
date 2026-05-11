// testEmail.js — Run this from your backend folder:
// node testEmail.js

import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? `✅ "${process.env.EMAIL_PASS}" (${process.env.EMAIL_PASS.length} chars)` : "❌ MISSING");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Transporter error:", error.message);
  } else {
    console.log("✅ Email transporter is ready! Sending test email...");

    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // sends to yourself
      subject: "Snapgram Test Email",
      text: "If you see this, email is working!",
    }, (err, info) => {
      if (err) {
        console.error("❌ Send error:", err.message);
      } else {
        console.log("✅ Email sent successfully!", info.response);
      }
    });
  }
});