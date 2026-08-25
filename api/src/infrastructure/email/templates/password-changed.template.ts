import {
  renderBaseEmail,
  renderEmailButton,
  renderInfoBox,
  escapeHtml,
} from './base.template';

export interface PasswordChangedTemplateProps {
  userName?: string;
  frontendUrl?: string;
  forgotPasswordUrl?: string;
}

export function renderPasswordChangedTemplate(
  props: PasswordChangedTemplateProps,
): {
  subject: string;
  html: string;
  text: string;
} {
  const { userName, frontendUrl, forgotPasswordUrl } = props;
  const greetingName = userName ? escapeHtml(userName) : 'користувачу';
  const siteUrl = frontendUrl || 'https://smak-app.pp.ua';
  const resetUrl = forgotPasswordUrl || `${siteUrl}/auth/forgot-password`;

  const subject = 'Пароль успішно змінено | SMAK';
  const previewText = `Пароль до вашого облікового запису на SMAK було оновлено.`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-family: 'Manrope', sans-serif; font-size: 16px; line-height: 26px; color: #242934;">
      Вітаємо, <strong>${greetingName}</strong>!
    </p>
    <p style="margin: 0 0 24px 0; font-family: 'Manrope', sans-serif; font-size: 15px; line-height: 24px; color: #495057;">
      Пароль для входу до вашого облікового запису на кулінарній платформі <strong>SMAK</strong> було успішно змінено.
    </p>

    <!-- Info / Action Button -->
    ${renderEmailButton('Увійти на платформу', `${siteUrl}/auth/login`)}

    <!-- Security Box -->
    ${renderInfoBox(
      `Якщо це зробили ви — додаткових дій не потрібно.<br>Якщо ви <strong>НЕ змінювали пароль</strong>, негайно <a href="${resetUrl}" style="color: #F05B5B; font-weight: bold; text-decoration: underline;">відновіть доступ</a>.`,
      'security',
    )}
  `;

  const html = renderBaseEmail({
    title: subject,
    previewText,
    heading: 'Пароль успішно змінено',
    subheading: 'Оновлення пароля вашого облікового запису',
    contentHtml,
    frontendUrl: siteUrl,
  });

  const text = `
Вітаємо, ${greetingName}!

Пароль для входу до вашого облікового запису на платформі SMAK було успішно оновлено.

Якщо це зробили ви — все гаразд.
Якщо ви НЕ змінювали пароль — терміново відновіть доступ за посиланням:
${resetUrl}

---
SMAK
${siteUrl}
`.trim();

  return { subject, html, text };
}
