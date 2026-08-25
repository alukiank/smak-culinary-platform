import * as fs from 'fs';
import * as path from 'path';
import {
  renderVerifyEmailTemplate,
  renderResendVerifyEmailTemplate,
  renderResetPasswordTemplate,
  renderPasswordChangedTemplate,
} from '../src/infrastructure/email/templates';

const outputDir = path.join(__dirname, '../../email-previews');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const dummyToken = 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
const frontendUrl = 'http://localhost:3000';

// 1. Verify Email
const verifyEmail = renderVerifyEmailTemplate({
  userName: 'Олександр',
  verifyUrl: `${frontendUrl}/auth/verify?token=${dummyToken}`,
  frontendUrl,
});
fs.writeFileSync(path.join(outputDir, '1_verify_email.html'), verifyEmail.html, 'utf-8');
fs.writeFileSync(path.join(outputDir, '1_verify_email.txt'), verifyEmail.text, 'utf-8');

// 2. Resend Verify Email
const resendVerify = renderResendVerifyEmailTemplate({
  userName: 'Марія',
  verifyUrl: `${frontendUrl}/auth/verify?token=${dummyToken}`,
  frontendUrl,
});
fs.writeFileSync(path.join(outputDir, '2_resend_verify_email.html'), resendVerify.html, 'utf-8');
fs.writeFileSync(path.join(outputDir, '2_resend_verify_email.txt'), resendVerify.text, 'utf-8');

// 3. Reset Password
const resetPassword = renderResetPasswordTemplate({
  userName: 'Андрій',
  resetUrl: `${frontendUrl}/auth/reset-password?token=${dummyToken}`,
  expireMinutes: 60,
  frontendUrl,
});
fs.writeFileSync(path.join(outputDir, '3_reset_password.html'), resetPassword.html, 'utf-8');
fs.writeFileSync(path.join(outputDir, '3_reset_password.txt'), resetPassword.text, 'utf-8');

// 4. Password Changed Alert
const passwordChanged = renderPasswordChangedTemplate({
  userName: 'Андрій',
  frontendUrl,
  forgotPasswordUrl: `${frontendUrl}/auth/forgot-password`,
});
fs.writeFileSync(path.join(outputDir, '4_password_changed.html'), passwordChanged.html, 'utf-8');
fs.writeFileSync(path.join(outputDir, '4_password_changed.txt'), passwordChanged.text, 'utf-8');

console.log('Successfully generated email preview files in:', outputDir);
