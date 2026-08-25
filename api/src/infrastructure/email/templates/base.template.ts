export interface BaseEmailOptions {
  title: string;
  previewText: string;
  heading: string;
  subheading?: string;
  contentHtml: string;
  frontendUrl?: string;
}

export function renderBaseEmail(options: BaseEmailOptions): string {
  const {
    title,
    previewText,
    heading,
    subheading,
    contentHtml,
    frontendUrl = 'https://smak-app.pp.ua',
  } = options;

  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="uk" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@600;700&family=Manrope:wght@400;500;600;700&display=swap');
    
    html, body {
      margin: 0 auto !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background-color: #FFF8F3;
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    * {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    a {
      text-decoration: none;
      color: #F05B5B;
    }
    .btn-gradient:hover {
      background: #E04848 !important;
    }
    @media screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        margin: auto !important;
      }
      .fluid-padding {
        padding-left: 20px !important;
        padding-right: 20px !important;
        padding-top: 28px !important;
        padding-bottom: 28px !important;
      }
      .hero-heading {
        font-size: 21px !important;
        line-height: 27px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FFF8F3; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <!-- Preheader text (hidden preview in inbox) -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
    ${escapeHtml(previewText)}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <!-- Background Wrapper Table -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FFF8F3; width: 100%; margin: 0; padding: 0;">
    <tr>
      <td align="center" style="padding: 36px 16px 40px 16px;">
        <!-- Container Table (580px) -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 580px; width: 100%; margin: 0 auto;" class="email-container">
          
          <!-- BRAND HEADER: Clean logo as photo without colored box -->
          <tr>
            <td align="center" style="padding-bottom: 26px;">
              <a href="${frontendUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                  <tr>
                    <td align="center" style="vertical-align: middle;">
                      <img 
                        src="${frontendUrl}/images/logo.png" 
                        width="38" 
                        height="38" 
                        alt="SMAK Logo" 
                        style="display: block; width: 38px; height: 38px; border: 0; outline: none; object-fit: contain;" 
                      />
                    </td>
                    <td style="padding-left: 10px; vertical-align: middle; text-align: left;">
                      <span style="font-family: 'Comfortaa', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 700; color: #242934; letter-spacing: -0.5px; display: block; line-height: 24px;">
                        SMAK
                      </span>
                    </td>
                  </tr>
                </table>
              </a>
            </td>
          </tr>

          <!-- MAIN CARD: Pure white card with no box border outline -->
          <tr>
            <td style="background-color: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 24px rgba(71, 26, 2, 0.06); overflow: hidden; padding: 0;">
              
              <!-- Gradient Accent Line -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width: 100%; margin: 0;">
                <tr>
                  <td height="4" style="background: linear-gradient(90deg, #F05B5B 0%, #F7934C 50%, #F6CB45 100%); background-color: #F05B5B; font-size: 1px; line-height: 1px;">&nbsp;</td>
                </tr>
              </table>

              <!-- Card Content Area -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width: 100%; margin: 0;">
                <tr>
                  <td class="fluid-padding" style="padding: 36px 36px 36px 36px; text-align: left;">
                    
                    <!-- Heading -->
                    <h1 class="hero-heading" style="margin: 0 0 8px 0; font-family: 'Comfortaa', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 23px; font-weight: 700; color: #242934; line-height: 29px; letter-spacing: -0.3px;">
                      ${escapeHtml(heading)}
                    </h1>

                    ${
                      subheading
                        ? `
                    <!-- Subheading -->
                    <p style="margin: 0 0 24px 0; font-family: 'Manrope', sans-serif; font-size: 14px; line-height: 22px; color: #6C757D;">
                      ${escapeHtml(subheading)}
                    </p>
                    `
                        : '<div style="height: 16px;"></div>'
                    }

                    <!-- Main Dynamic Content HTML -->
                    ${contentHtml}

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER: Clean and minimalistic without stars or fluff -->
          <tr>
            <td align="center" style="padding-top: 26px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width: 100%; margin: 0;">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <p style="margin: 0; font-family: 'Manrope', sans-serif; font-size: 12px; line-height: 18px; color: #8F97A3;">
                      Цей лист надіслано автоматично сервісом <a href="${frontendUrl}" target="_blank" style="color: #F05B5B; font-weight: 600; text-decoration: none;">Smak</a>.<br>
                      Будь ласка, не відповідайте на це повідомлення.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="margin: 0; font-family: 'Manrope', sans-serif; font-size: 11px; color: #ADB5BD;">
                      © ${currentYear} SMAK. Всі права захищено.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Bulletproof CTA button component with generous explicit top and bottom padding
 */
export function renderEmailButton(text: string, url: string): string {
  return `
  <!-- Button Container with clear top & bottom spacing -->
  <div style="padding-top: 28px; padding-bottom: 28px; text-align: center;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 0 auto;">
      <tr>
        <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, #F05B5B 0%, #F7934C 100%); background-color: #F05B5B; box-shadow: 0 4px 14px rgba(240, 91, 91, 0.3);">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:46px;v-text-anchor:middle;width:240px;" arcsize="20%" fillcolor="#F05B5B" stroke="f">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:'Manrope',sans-serif;font-size:15px;font-weight:bold;">
              ${escapeHtml(text)}
            </center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${url}" target="_blank" class="btn-gradient" style="background: linear-gradient(135deg, #F05B5B 0%, #F7934C 100%); background-color: #F05B5B; border: 1px solid #F05B5B; font-family: 'Manrope', sans-serif; font-size: 15px; font-weight: 700; line-height: 18px; color: #FFFFFF; text-decoration: none; padding: 14px 32px; display: inline-block; border-radius: 10px; text-align: center; letter-spacing: 0.2px;">
            ${escapeHtml(text)} &rarr;
          </a>
          <!--<![endif]-->
        </td>
      </tr>
    </table>
  </div>`;
}

/**
 * Clean Info / Advisory Callout Block with clear top and bottom spacing
 */
export function renderInfoBox(
  content: string,
  variant: 'info' | 'warning' | 'security' = 'info',
): string {
  let bgColor = '#FFF9F5';
  let borderLeftColor = '#F7934C';
  let title = 'Інформація';
  let titleColor = '#B55D21';

  if (variant === 'warning') {
    bgColor = '#FEF8EA';
    borderLeftColor = '#F6CB45';
    title = 'Термін дії';
    titleColor = '#9A6B0A';
  } else if (variant === 'security') {
    bgColor = '#F4F7FB';
    borderLeftColor = '#6366F1';
    title = 'Безпека';
    titleColor = '#2F4E75';
  }

  return `
  <!-- Info/Warning Box Container -->
  <div style="margin-top: 6px; margin-bottom: 24px; background-color: ${bgColor}; border-left: 4px solid ${borderLeftColor}; border-radius: 6px; padding: 14px 16px; text-align: left;">
    <div style="font-family: 'Manrope', sans-serif; font-size: 13px; font-weight: 700; color: ${titleColor}; margin-bottom: 4px;">
      ${title}
    </div>
    <div style="font-family: 'Manrope', sans-serif; font-size: 13px; line-height: 20px; color: #495057;">
      ${content}
    </div>
  </div>`;
}

/**
 * Direct Link Fallback Box
 */
export function renderDirectLinkBox(url: string): string {
  return `
  <!-- Direct Link Fallback Box -->
  <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #F4EBE5; text-align: left;">
    <p style="margin: 0 0 6px 0; font-family: 'Manrope', sans-serif; font-size: 12px; color: #8F97A3; line-height: 18px;">
      Якщо кнопка не працює, перейдіть за прямим посиланням:
    </p>
    <p style="margin: 0; word-break: break-all; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 11px; line-height: 16px;">
      <a href="${url}" target="_blank" style="color: #F05B5B; text-decoration: underline;">
        ${escapeHtml(url)}
      </a>
    </p>
  </div>`;
}

/**
 * Simple HTML escape
 */
export function escapeHtml(text?: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
