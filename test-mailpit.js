// Test script to send an email directly to Mailpit
import nodemailer from 'nodemailer';

async function sendTestEmail() {
  // Create a test SMTP transporter
  const transporter = nodemailer.createTransport({
    host: '127.0.0.1',
    port: 1025, // Mailpit SMTP port
    secure: false,
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Send mail with defined transport object
    const info = await transporter.sendMail({
      from: '"Test Sender" <test@example.com>',
      to: 'recipient@example.com',
      subject: 'Test Email to Mailpit',
      text: 'This is a test email sent to Mailpit',
      html: '<b>This is a test email sent to Mailpit</b>'
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

sendTestEmail(); 