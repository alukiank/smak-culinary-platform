import {
  renderBaseEmail,
  renderEmailButton,
  renderInfoBox,
  renderDirectLinkBox,
  escapeHtml,
} from './base.template';

export interface ResetPasswordTemplateProps {
  userName?: string;
  resetUrl: string;
  expireMinutes?: number;
  frontendUrl?: string;
}

export function renderResetPasswordTemplate(
  props: ResetPasswordTemplateProps,
): {
  subject: string;
  html: string;
  text: string;
} {
  const { userName, resetUrl, expireMinutes = 60, frontendUrl } = props;
  const greetingName = userName ? escapeHtml(userName) : 'користувачу';

  const subject = 'Відновлення пароля | SMAK';
  const previewText = `Запит на відновлення пароля для вашого акаунта на SMAK (дійсне ${expireMinutes} хв).`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-family: 'Manrope', sans-serif; font-size: 16px; line-height: 26px; color: #242934;">
      Вітаємо, <strong>${greetingName}</strong>!
    </p>
    <p style="margin: 0 0 24px 0; font-family: 'Manrope', sans-serif; font-size: 15px; line-height: 24px; color: #495057;">
      Отримано запит на скидання пароля для вашого облікового запису на платформі <strong>SMAK</strong>. Натисніть кнопку нижче, щоб встановити новий пароль:
    </p>

    <!-- Call to Action Button -->
    ${renderEmailButton('Встановити новий пароль', resetUrl)}

    <!-- Expiration & Security Info Box -->
    ${renderInfoBox(
      `Посилання є одноразовим та дійсне протягом <strong>${expireMinutes} хвилин</strong>.<br>Якщо ви не надсилали цей запит, просто проігноруйте лист — ваш пароль залишається у повній безпеці.`,
      'warning',
    )}

    <!-- Direct Link Fallback -->
    ${renderDirectLinkBox(resetUrl)}
  `;

  const html = renderBaseEmail({
    title: subject,
    previewText,
    heading: 'Відновлення пароля',
    subheading: 'Встановлення нового пароля до вашого облікового запису',
    contentHtml,
    frontendUrl,
  });

  const text = `
Вітаємо, ${greetingName}!

Отримано запит на відновлення пароля для вашого облікового запису на SMAK.
Перейдіть за посиланням (дійсне ${expireMinutes} хв):
${resetUrl}

Якщо ви не робили цього запиту, проігноруйте цей лист.

---
SMAK
${frontendUrl || 'https://smak-app.pp.ua'}
`.trim();

  return { subject, html, text };
}
