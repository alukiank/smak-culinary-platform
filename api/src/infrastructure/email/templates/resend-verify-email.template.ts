import {
  renderBaseEmail,
  renderEmailButton,
  renderInfoBox,
  renderDirectLinkBox,
  escapeHtml,
} from './base.template';

export interface ResendVerifyEmailTemplateProps {
  userName?: string;
  verifyUrl: string;
  frontendUrl?: string;
}

export function renderResendVerifyEmailTemplate(
  props: ResendVerifyEmailTemplateProps,
): {
  subject: string;
  html: string;
  text: string;
} {
  const { userName, verifyUrl, frontendUrl } = props;
  const greetingName = userName ? escapeHtml(userName) : 'користувачу';

  const subject = 'Повторне підтвердження пошти | SMAK';
  const previewText = `Повторне посилання для підтвердження пошти на SMAK.`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-family: 'Manrope', sans-serif; font-size: 16px; line-height: 26px; color: #242934;">
      Вітаємо, <strong>${greetingName}</strong>!
    </p>
    <p style="margin: 0 0 24px 0; font-family: 'Manrope', sans-serif; font-size: 15px; line-height: 24px; color: #495057;">
      Ви надіслали запит на повторне отримання посилання для активації вашого профілю на <strong>SMAK</strong>. Натисніть кнопку нижче, щоб завершити верифікацію:
    </p>

    <!-- Call to Action Button -->
    ${renderEmailButton('Підтвердити пошту', verifyUrl)}

    <!-- Info Box -->
    ${renderInfoBox(
      'Якщо ви не запитували це посилання, просто проігноруйте цей лист. Ваш профіль залишиться у безпеці.',
      'info',
    )}

    <!-- Direct Link Fallback -->
    ${renderDirectLinkBox(verifyUrl)}
  `;

  const html = renderBaseEmail({
    title: subject,
    previewText,
    heading: 'Підтвердження пошти',
    subheading: 'Оновлене посилання для активації вашого профілю',
    contentHtml,
    frontendUrl,
  });

  const text = `
Вітаємо, ${greetingName}!

Отримано запит на повторне посилання для підтвердження пошти на SMAK.
Перейдіть за посиланням для верифікації:
${verifyUrl}

Якщо ви не запитували це посилання, проігноруйте цей лист.

---
SMAK
${frontendUrl || 'https://smak-app.pp.ua'}
`.trim();

  return { subject, html, text };
}
