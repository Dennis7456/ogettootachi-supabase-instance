/* eslint-disable no-console, no-undef */
import nodemailer from "nodemailer";

// Test script to send an email directly to Mailpit
async function sendTestEmail() {
  // Create a test SMTP transporter
  const _transporter = nodemailer.createTransport({
    host: "127.0.0.1",
    port: 1025, // Mailpit SMTP port
    secure: false,
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Send mail with defined transport object
    const _info = await _transporter.sendMail({
      from: '"Test Sender" <test@example.com>',
      to: "recipient@example.com",
      subject: "Test Email to Mailpit",
      text: "This is a test email sent to Mailpit",
      html: "<b>This is a test email sent to Mailpit</b>",
    });

    console.log("Email sent successfully");
  } catch (_error) {
    console.error("Error sending email:", _error);
  }
}

sendTestEmail();
