export function renderTemplate(source, vars = {}) {
  return String(source || "").replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    const value = vars[key];
    return value == null ? "" : String(value);
  });
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function linkify(escaped) {
  return escaped.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    (email) =>
      `<a href="mailto:${email}" style="color:#c1964a;font-weight:700;text-decoration:underline;">${email}</a>`,
  );
}

function preheaderFrom(text) {
  const lines = String(text || "")
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return (
    lines.find((line, index) => index > 0 && !/^(hi|hello)\b/i.test(line)) ||
    lines[1] ||
    lines[0] ||
    "You're on the Opsy founding list."
  );
}

export function textToHtml(text) {
  return String(text)
    .split(/\n{2,}/)
    .map((paragraph) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return "";
      const html = linkify(escapeHtml(trimmed)).replace(/\n/g, "<br>");
      if (/refund/i.test(trimmed)) {
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;">
          <tr>
            <td style="background:#f8f1de;border:1px solid #eac285;border-radius:16px;padding:20px 22px;">
              <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.16em;font-weight:700;color:#c1964a;">REFUND</p>
              <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#18372f;">${html}</p>
            </td>
          </tr>
        </table>`;
      }
      if (/^[—–-]\s/.test(trimmed)) {
        return `<p style="margin:28px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#1f5545;">${html}</p>`;
      }
      return `<p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.7;color:#18372f;">${html}</p>`;
    })
    .join("");
}

export function wrapHtml(inner, { subject = "", preheader = "" } = {}) {
  const headline = escapeHtml(subject || "You're on the list");
  const preview = escapeHtml(preheader || "You're on the founding list. We'll be in touch before launch.");
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>${headline}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f1e7;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preview}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7;margin:0;padding:0;">
      <tr>
        <td align="center" style="padding:36px 16px 48px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;border-collapse:separate;">
            <tr>
              <td style="background:#18372f;border-radius:24px 24px 0 0;padding:36px 36px 32px;text-align:center;">
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:12px;letter-spacing:0.32em;font-weight:700;color:#eac285;">OPSY</p>
                <p style="margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:0.22em;font-weight:700;color:#f6f1e7;">FOUNDING LIST</p>
                <p style="margin:14px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.15;font-weight:600;color:#fffdf8;">${headline}</p>
              </td>
            </tr>
            <tr>
              <td style="height:4px;background:#eac285;font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="background:#fffdf8;padding:36px 36px 12px;">
                ${inner}
              </td>
            </tr>
            <tr>
              <td style="background:#fffdf8;border-radius:0 0 24px 24px;padding:8px 36px 36px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e6e0d4;">
                  <tr>
                    <td style="padding-top:22px;">
                      <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#7a8a84;">
                        © 2026 HomeOps Inc. · <a href="https://heyopsy.com" style="color:#1f5545;text-decoration:none;font-weight:700;">heyopsy.com</a>
                      </p>
                      <p style="margin:8px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:13px;font-style:italic;color:#7a8a84;">
                        Building what's next. A more human real estate industry.
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

export function buildEmailContent(template, vars) {
  const subject = renderTemplate(template.subject, vars);
  const text = renderTemplate(template.body, vars);
  return {
    subject,
    text,
    html: wrapHtml(textToHtml(text), {
      subject,
      preheader: preheaderFrom(text),
    }),
  };
}
