import "server-only";
import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "SherryBerries <onboarding@resend.dev>";

let client: Resend | null = null;
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!client) client = new Resend(key);
  return client;
}

export async function sendVerificationEmail({
  to,
  name,
  verifyUrl,
}: {
  to: string;
  name: string | null;
  verifyUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resend = getClient();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY is not configured." };
  }

  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi there,";

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: "Verify your SherryBerries email ✦",
      html: verificationHtml({ greeting, verifyUrl }),
      text: `${greeting}\n\nWelcome to SherryBerries. Confirm your email to activate your account:\n\n${verifyUrl}\n\nThis link expires in 24 hours. If you didn't create an account, you can ignore this email.`,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to send email.",
    };
  }
}

function verificationHtml({
  greeting,
  verifyUrl,
}: {
  greeting: string;
  verifyUrl: string;
}): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#0d0608;font-family:Helvetica,Arial,sans-serif;color:#f5e9ee;padding:32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#160a10;border:1px solid rgba(255,79,163,0.18);border-radius:20px;overflow:hidden;">
          <tr><td style="padding:36px 36px 8px;">
            <div style="font-size:26px;letter-spacing:0.02em;color:#ffffff;">Sherry<span style="font-style:italic;color:#ff4fa3;">Berries</span></div>
          </td></tr>
          <tr><td style="padding:8px 36px 0;">
            <h1 style="font-size:24px;line-height:1.25;color:#ffffff;margin:16px 0 12px;">Confirm your email ✦</h1>
            <p style="font-size:15px;line-height:1.6;color:#cbb8c0;margin:0 0 8px;">${greeting}</p>
            <p style="font-size:15px;line-height:1.6;color:#cbb8c0;margin:0 0 24px;">Welcome to the SherryBerries world. Tap the button below to verify your email and activate your account.</p>
          </td></tr>
          <tr><td style="padding:0 36px 28px;">
            <a href="${verifyUrl}" style="display:inline-block;background:linear-gradient(135deg,#ff4fa3,#d6266f);color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:0.14em;text-transform:uppercase;padding:16px 28px;border-radius:999px;">Verify my email</a>
          </td></tr>
          <tr><td style="padding:0 36px 36px;">
            <p style="font-size:12px;line-height:1.6;color:#8a7780;margin:0;">This link expires in 24 hours. If the button doesn't work, paste this link into your browser:</p>
            <p style="font-size:12px;line-height:1.6;color:#ff4fa3;word-break:break-all;margin:8px 0 0;">${verifyUrl}</p>
            <p style="font-size:12px;line-height:1.6;color:#8a7780;margin:16px 0 0;">If you didn't create a SherryBerries account, you can safely ignore this email.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
