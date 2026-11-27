import { AppLocale } from '@birthday/shared-models';

const CALENDAR_LABELS: Record<AppLocale, string> = {
  en: 'Open calendar',
  es: 'Abrir calendario',
  de: 'Kalender öffnen',
  fr: 'Ouvrir le calendrier',
  ru: 'Открыть календарь',
  uk: 'Відкрити календар',
};

export function renderBirthdayEmail(title: string, body: string, locale: AppLocale, appOrigin: string): string {
  const calendarUrl = escapeHtml(appOrigin + '/');
  const logoUrl = escapeHtml(appOrigin + '/icon-192.png');
  const label = CALENDAR_LABELS[locale];
  const rows = body
    .split('\n')
    .map((line) => `<p style="margin:0 0 12px">${escapeHtml(line)}</p>`)
    .join('');

  return `<!doctype html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#fff4ec;color:#2d1911;font:16px/1.5 Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
    <tr><td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:18px">
        <tr><td style="padding:28px 24px">
          <p style="margin:0 0 20px;color:#963a0c;font-size:18px;font-weight:bold">
            <img src="${logoUrl}" width="32" height="32" alt="" style="vertical-align:middle;margin-right:8px">Birthdly
          </p>
          <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2">${escapeHtml(title)}</h1>
          ${rows}
          <p style="margin:24px 0 0">
            <a href="${calendarUrl}" style="display:inline-block;background:#963a0c;color:#fff;text-decoration:none;border-radius:24px;padding:12px 20px;font-weight:bold">${label}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
