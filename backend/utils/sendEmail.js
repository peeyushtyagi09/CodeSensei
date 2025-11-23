const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // IMPORTANT: this fixes most Gmail issues
    host: process.env.EMAIL_HOST, // smtp.gmail.com
    port: Number(process.env.EMAIL_PORT), // 587
    secure: false, // TLS
    auth: {
      user: process.env.EMAIL_USER, // your Gmail
      pass: process.env.EMAIL_PASS, // your App Password
    },
    tls: {
      rejectUnauthorized: false, // REQUIRED on Windows for Gmail
    }
  });

  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL,
    to,
    subject,
    text,
    html,
  });

  return info;
};

module.exports = sendEmail;
