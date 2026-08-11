import 'server-only'

/**
 * Notification email bodies.
 *
 * Plain functions returning strings rather than React Email: these are two
 * internal notifications, not a campaign, and the whole point of the site is
 * that Kova's email expertise lives in Klaviyo — not in this repository.
 *
 * Everything interpolated here comes from a public form, so every value is
 * escaped before it reaches the HTML body.
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char)
}

export type ContactNotificationInput = {
  name: string
  email: string
  company: string | null
  websiteUrl: string | null
  monthlyRevenue: string | null
  message: string
  source: string | null
  adminUrl: string
}

export function contactNotificationSubject(input: ContactNotificationInput): string {
  const qualifier = input.monthlyRevenue ? ` · ${input.monthlyRevenue}` : ''
  return `New enquiry — ${input.name}${input.company ? ` (${input.company})` : ''}${qualifier}`
}

export function contactNotificationText(input: ContactNotificationInput): string {
  const rows = [
    ['Name', input.name],
    ['Email', input.email],
    ['Company', input.company],
    ['Website', input.websiteUrl],
    ['Monthly revenue', input.monthlyRevenue],
    ['Page', input.source],
  ]
    .filter((row): row is [string, string] => Boolean(row[1]))
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n')

  return [
    'New enquiry from the Kova website.',
    '',
    rows,
    '',
    'Message:',
    input.message,
    '',
    `Open in the admin: ${input.adminUrl}`,
  ].join('\n')
}

export function contactNotificationHtml(input: ContactNotificationInput): string {
  const rows = [
    ['Name', input.name],
    ['Email', input.email],
    ['Company', input.company],
    ['Website', input.websiteUrl],
    ['Monthly revenue', input.monthlyRevenue],
    ['Page', input.source],
  ]
    .filter((row): row is [string, string] => Boolean(row[1]))
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:6px 16px 6px 0;color:#64748b;font-size:13px;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td>
          <td style="padding:6px 0;color:#0b1120;font-size:14px">${escapeHtml(value)}</td>
        </tr>`,
    )
    .join('')

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f8fafc;padding:32px;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
      <div style="padding:24px 28px;border-bottom:1px solid #e2e8f0">
        <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#0d9488">New enquiry</p>
        <h1 style="margin:8px 0 0;font-size:20px;color:#0b1120">${escapeHtml(input.name)}</h1>
      </div>
      <div style="padding:24px 28px">
        <table style="width:100%;border-collapse:collapse">${rows}</table>
        <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0">
          <p style="margin:0 0 8px;color:#64748b;font-size:13px">Message</p>
          <p style="margin:0;color:#0b1120;font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(input.message)}</p>
        </div>
        <a href="${escapeHtml(input.adminUrl)}" style="display:inline-block;margin-top:24px;background:#0ea5e9;color:#ffffff;text-decoration:none;font-size:14px;font-weight:500;padding:11px 22px;border-radius:999px">Open in the admin</a>
      </div>
    </div>
  </body>
</html>`
}
