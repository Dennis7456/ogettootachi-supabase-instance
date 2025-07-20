// Script to configure email templates in Supabase
// This script applies the email template configuration with proper branding
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const _supabaseService = _createClient(supabaseUrl, supabaseServiceKey);
// Email templates with application branding
const emailTemplates = {
  confirm_template: {
    subject: 'Confirm Your Email - Ogetto, Otachi & Company Advocates'
    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Your Email - Ogetto, Otachi & Company Advocates</title>
    <style>
        body {
            font-family: 'Open Sans', Arial, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            margin: 0;
            padding: 0;
            background-color: #f7fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #467c37 0%, #1a365d 100%);
            padding: 30px;
            text-align: center;
        }
        .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }
        .logo-icon {
            width: 40px;
            height: 40px;
            background-color: #d4af37;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-size: 20px;
            color: #2d3748;
        }
        .company-name {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
        }
        .content {
            padding: 40px 30px;
        }
        .title {
            color: #2d3748;
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 20px;
            text-align: center;
        }
        .message {
            color: #4a5568;
            font-size: 16px;
            margin-bottom: 30px;
            text-align: center;
        }
        .button {
            display: inline-block;
            background-color: #467c37;
            color: #ffffff;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: background-color 0.3s ease;
        }
        .button:hover {
            background-color: #1a365d;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .footer {
            background-color: #f7fafc;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text {
            color: #718096;
            font-size: 14px;
            margin: 0;
        }
        .accent {
            color: #d4af37;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <div class="logo-icon">⚖️</div>
                <h1 class="company-name">Ogetto, Otachi & Company</h1>
            </div>
        </div>
        
        <div class="content">
            <h2 class="title">Confirm Your Email Address</h2>
            <p class="message">
                Thank you for creating your administrator account with <span class="accent">Ogetto, Otachi & Company Advocates</span>. 
                To complete your registration and activate your account, please confirm your email address by clicking the button below.
            </p>
            
            <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="button">Confirm Email Address</a>
            </div>
            
            <p class="message">
                If you did not create this account, you can safely ignore this email. 
                The confirmation link will expire in 24 hours.
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                © 2024 Ogetto, Otachi & Company Advocates. All rights reserved.<br>
                This email was sent to {{ .Email }}. If you have any questions, please contact our support team.
            </p>
        </div>
    </div>
</body>
</html>`
  }
  reset_template: {
    subject: 'Reset Your Password - Ogetto, Otachi & Company Advocates'
    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password - Ogetto, Otachi & Company Advocates</title>
    <style>
        body {
            font-family: 'Open Sans', Arial, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            margin: 0;
            padding: 0;
            background-color: #f7fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #467c37 0%, #1a365d 100%);
            padding: 30px;
            text-align: center;
        }
        .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }
        .logo-icon {
            width: 40px;
            height: 40px;
            background-color: #d4af37;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-size: 20px;
            color: #2d3748;
        }
        .company-name {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
        }
        .content {
            padding: 40px 30px;
        }
        .title {
            color: #2d3748;
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 20px;
            text-align: center;
        }
        .message {
            color: #4a5568;
            font-size: 16px;
            margin-bottom: 30px;
            text-align: center;
        }
        .button {
            display: inline-block;
            background-color: #467c37;
            color: #ffffff;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: background-color 0.3s ease;
        }
        .button:hover {
            background-color: #1a365d;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .footer {
            background-color: #f7fafc;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text {
            color: #718096;
            font-size: 14px;
            margin: 0;
        }
        .accent {
            color: #d4af37;
            font-weight: 600;
        }
        .warning {
            background-color: #fef5e7;
            border: 1px solid #f6ad55;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            color: #744210;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <div class="logo-icon">⚖️</div>
                <h1 class="company-name">Ogetto, Otachi & Company</h1>
            </div>
        </div>
        
        <div class="content">
            <h2 class="title">Reset Your Password</h2>
            <p class="message">
                You requested to reset your password for your administrator account at <span class="accent">Ogetto, Otachi & Company Advocates</span>. 
                Click the button below to create a new password.
            </p>
            
            <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
                <strong>Security Notice:</strong> This password reset link will expire in 1 hour. 
                If you did not request this password reset, please ignore this email and contact our support team immediately.
            </div>
            
            <p class="message">
                If the button above doesn't work, you can copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #467c37; word-break: break-all;">{{ .ConfirmationURL }}</a>
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                © 2024 Ogetto, Otachi & Company Advocates. All rights reserved.<br>
                This email was sent to {{ .Email }}. If you have any questions, please contact our support team.
            </p>
        </div>
    </div>
</body>
</html>`
  }
  magic_link_template: {
    subject: 'Sign In - Ogetto, Otachi & Company Advocates'
    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sign In - Ogetto, Otachi & Company Advocates</title>
    <style>
        body {
            font-family: 'Open Sans', Arial, sans-serif;
            line-height: 1.6;
            color: #2d3748;
            margin: 0;
            padding: 0;
            background-color: #f7fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #467c37 0%, #1a365d 100%);
            padding: 30px;
            text-align: center;
        }
        .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
        }
        .logo-icon {
            width: 40px;
            height: 40px;
            background-color: #d4af37;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-size: 20px;
            color: #2d3748;
        }
        .company-name {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
        }
        .content {
            padding: 40px 30px;
        }
        .title {
            color: #2d3748;
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 20px;
            text-align: center;
        }
        .message {
            color: #4a5568;
            font-size: 16px;
            margin-bottom: 30px;
            text-align: center;
        }
        .button {
            display: inline-block;
            background-color: #467c37;
            color: #ffffff;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            text-align: center;
            transition: background-color 0.3s ease;
        }
        .button:hover {
            background-color: #1a365d;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .footer {
            background-color: #f7fafc;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        .footer-text {
            color: #718096;
            font-size: 14px;
            margin: 0;
        }
        .accent {
            color: #d4af37;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <div class="logo-icon">⚖️</div>
                <h1 class="company-name">Ogetto, Otachi & Company</h1>
            </div>
        </div>
        
        <div class="content">
            <h2 class="title">Sign In to Your Account</h2>
            <p class="message">
                Click the button below to sign in to your administrator account at <span class="accent">Ogetto, Otachi & Company Advocates</span>.
            </p>
            
            <div class="button-container">
                <a href="{{ .ConfirmationURL }}" class="button">Sign In</a>
            </div>
            
            <p class="message">
                This sign-in link will expire in 1 hour. If you did not request this sign-in link, please ignore this email.
            </p>
        </div>
        
        <div class="footer">
            <p class="footer-text">
                © 2024 Ogetto, Otachi & Company Advocates. All rights reserved.<br>
                This email was sent to {{ .Email }}. If you have any questions, please contact our support team.
            </p>
        </div>
    </div>
</body>
</html>`
  }
};
async function configureEmailTemplates() {
  try {
    // Note: In a real Supabase setup, you would configure these templates
    // through the Supabase Dashboard or API. For local development
    // we'll create the configuration files and provide instructions.
    ('1. Go to Supabase Dashboard > Authentication > Email Templates');
    // Save templates to files for easy access
    const templatesDir = path.join(process.cwd(), 'email-templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir);
    }
    Object.entries(emailTemplates).forEach(([templateName, template]) => {
      const fileName = `${templateName}.html`;
      const filePath = path.join(templatesDir, fileName);
      fs.writeFileSync(filePath, template.html);
    });
  } catch (_error) {
    console._error('❌ Email template configuration failed:', _error.message);
    throw _error;
  }
}
// Run the configuration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  configureEmailTemplates();
}
export default configureEmailTemplates;
