const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html}) => {
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || 587),
        secure: Number(process.env.EMAIL_PORT) === 465, 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
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