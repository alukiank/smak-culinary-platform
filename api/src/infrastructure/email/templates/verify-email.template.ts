import {
  renderBaseEmail,
  renderEmailButton,
  renderInfoBox,
  renderDirectLinkBox,
  escapeHtml,
} from './base.template';

export interface VerifyEmailTemplateProps {
  userName?: string;
  verifyUrl: string;
  frontendUrl?: string;
}

export function renderVerifyEmailTemplate(props: VerifyEmailTemplateProps): {
  subject: string;
  html: string;
  text: string;
} {
  const { userName, verifyUrl, frontendUrl } = props;
  const greetingName = userName ? escapeHtml(userName) : 'користувачу';

  const subject = 'Підтвердження електронної пошти | SMAK';
  const previewText = `Підтвердіть вашу пошту для активації акаунта SMAK.`;

  const contentHtml = `
    <p style="margin: 0 0 16px 0; font-family: 'Manrope', sans-serif; font-size: 16px; line-height: 26px; color: #242934;">
      Вітаємо, <strong>${greetingName}</strong>!
    </p>
    <p style="margin: 0 0 24px 0; font-family: 'Manrope', sans-serif; font-size: 15px; line-height: 24px; color: #495057;">
      Дякуємо за реєстрацію на кулінарній платформі <strong>SMAK</strong>. Будь ласка, підтвердіть вашу адресу електронної пошти для завершення реєстрації та активації облікового запису.
    </p>

    <!-- Call to Action Button -->
    ${renderEmailButton('Підтвердити пошту', verifyUrl)}

    <!-- Info Box -->
    ${renderInfoBox(
      'Якщо ви не створювали акаунт на платформі SMAK, просто проігноруйте цей лист. Обліковий запис не буде активовано без підтвердження.',
      'info',
    )}

    <!-- Direct Link Fallback -->
    ${renderDirectLinkBox(verifyUrl)}
  `;

  const html = renderBaseEmail({
    title: subject,
    previewText,
    heading: 'Підтвердження пошти',
    subheading: 'Підтвердіть вашу адресу для активації профілю',
    contentHtml,
    frontendUrl,
  });

  const text = `
Вітаємо, ${greetingName}!

Дякуємо за реєстрацію на кулінарній платформі SMAK. Будь ласка, підтвердіть вашу електронну пошту, перейшовши за посиланням:
${verifyUrl}

Якщо ви не реєструвалися на SMAK, просто проігноруйте це повідомлення.

---
SMAK
${frontendUrl || 'https://smak-app.pp.ua'}
`.trim();

  return { subject, html, text };
}
