import "server-only";
import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "SherryBerries <support@shopsherryberries.com>";

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

export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string | null;
  resetUrl: string;
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
      subject: "Reset your SherryBerries password ✦",
      html: passwordResetHtml({ greeting, resetUrl }),
      text: `${greeting}\n\nWe got a request to reset your SherryBerries password. Tap the link below to choose a new one:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.`,
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

export async function sendContactEmail({
  to,
  name,
  email,
  subject,
  message,
}: {
  /** Where the message is delivered — the site/domain holder's inbox. */
  to: string;
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resend = getClient();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY is not configured." };
  }

  const subjectLine = subject.trim() || "New contact form message";

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      // Owner replies land straight in the visitor's inbox.
      replyTo: email,
      subject: `[Contact] ${subjectLine}`,
      html: contactHtml({ name, email, subject: subjectLine, message }),
      text: `New message via the SherryBerries contact form\n\nFrom: ${name} <${email}>\nSubject: ${subjectLine}\n\n${message}`,
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

export type OrderEmailItem = {
  name: string;
  variant: string | null;
  qty: number;
  price: number;
};

export type OrderEmailData = {
  orderNumber: string;
  items: OrderEmailItem[];
  subtotal: number;
  discount: number;
  shipLabel: string;
  shipFee: number;
  total: number;
  paymentLabel: string;
  eta: string;
  shipTo: string;
};

export async function sendOrderConfirmationEmail({
  to,
  name,
  order,
}: {
  to: string;
  name: string | null;
  order: OrderEmailData;
}): Promise<{ ok: boolean; error?: string }> {
  const resend = getClient();
  if (!resend) {
    return { ok: false, error: "RESEND_API_KEY is not configured." };
  }

  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi there,";
  const lines = order.items
    .map(
      (it) =>
        `  • ${it.qty}× ${it.name}${it.variant ? ` (${it.variant})` : ""} — $${(it.price * it.qty).toFixed(2)}`,
    )
    .join("\n");

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `Your SherryBerries order ${order.orderNumber} is confirmed ✦`,
      html: orderConfirmationHtml({ greeting, order }),
      text: `${greeting}\n\nYour order is in — we're already wrapping it in pink and gold.\n\nOrder ${order.orderNumber}\n${lines}\n\nSubtotal: $${order.subtotal.toFixed(2)}${order.discount > 0 ? `\nDiscount: -$${order.discount.toFixed(2)}` : ""}\nShipping (${order.shipLabel}): ${order.shipFee === 0 ? "Free" : `$${order.shipFee.toFixed(2)}`}\nTotal: $${order.total.toFixed(2)}\n\nPayment: ${order.paymentLabel}\n${order.eta}.\n\nWith love,\nSherryBerries`,
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

function orderConfirmationHtml({
  greeting,
  order,
}: {
  greeting: string;
  order: OrderEmailData;
}): string {
  const money = (n: number) => `$${n.toFixed(2)}`;
  const itemRows = order.items
    .map(
      (it) => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid rgba(255,79,163,0.12);font-size:14px;color:#f5e9ee;">
                ${it.qty}× ${it.name}${it.variant ? `<span style="color:#8a7780;"> · ${it.variant}</span>` : ""}
              </td>
              <td align="right" style="padding:10px 0;border-bottom:1px solid rgba(255,79,163,0.12);font-size:14px;color:#f5e9ee;white-space:nowrap;">${money(it.price * it.qty)}</td>
            </tr>`,
    )
    .join("");

  const totalRow = (label: string, value: string, strong = false) => `
            <tr>
              <td style="padding:4px 0;font-size:${strong ? "16px" : "13px"};color:${strong ? "#ffffff" : "#cbb8c0"};${strong ? "font-weight:bold;" : ""}">${label}</td>
              <td align="right" style="padding:4px 0;font-size:${strong ? "18px" : "13px"};color:${strong ? "#ffffff" : "#cbb8c0"};${strong ? "font-weight:bold;" : ""}white-space:nowrap;">${value}</td>
            </tr>`;

  return `<!doctype html>
<html>
  <body style="margin:0;background:#0d0608;font-family:Helvetica,Arial,sans-serif;color:#f5e9ee;padding:32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#160a10;border:1px solid rgba(255,79,163,0.18);border-radius:20px;overflow:hidden;">
          <tr><td style="padding:36px 36px 8px;">
            <div style="font-size:26px;letter-spacing:0.02em;color:#ffffff;">Sherry<span style="font-style:italic;color:#ff4fa3;">Berries</span></div>
          </td></tr>
          <tr><td style="padding:8px 36px 0;">
            <h1 style="font-size:24px;line-height:1.25;color:#ffffff;margin:16px 0 12px;">Order confirmed ✦</h1>
            <p style="font-size:15px;line-height:1.6;color:#cbb8c0;margin:0 0 8px;">${greeting}</p>
            <p style="font-size:15px;line-height:1.6;color:#cbb8c0;margin:0 0 20px;">Your order is in — we're already wrapping it in pink and gold. Here's a copy for your records.</p>
          </td></tr>
          <tr><td style="padding:0 36px 8px;">
            <p style="font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8a7780;margin:0 0 4px;">Order number</p>
            <p style="font-size:18px;color:#ff4fa3;margin:0 0 16px;font-weight:bold;">${order.orderNumber}</p>
          </td></tr>
          <tr><td style="padding:0 36px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
          </td></tr>
          <tr><td style="padding:14px 36px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${totalRow("Subtotal", money(order.subtotal))}
              ${order.discount > 0 ? totalRow("Discount", `-${money(order.discount)}`) : ""}
              ${totalRow(`Shipping · ${order.shipLabel}`, order.shipFee === 0 ? "Free" : money(order.shipFee))}
              ${totalRow("Total", money(order.total), true)}
            </table>
          </td></tr>
          <tr><td style="padding:20px 36px 0;">
            <div style="background:rgba(255,79,163,0.08);border:1px solid rgba(255,79,163,0.2);border-radius:12px;padding:16px;">
              <p style="font-size:13px;line-height:1.6;color:#f5e9ee;margin:0 0 4px;"><strong>${order.eta}.</strong></p>
              <p style="font-size:13px;line-height:1.6;color:#cbb8c0;margin:0;">Ship to: ${order.shipTo}</p>
              <p style="font-size:13px;line-height:1.6;color:#cbb8c0;margin:6px 0 0;">Payment: ${order.paymentLabel}</p>
            </div>
          </td></tr>
          <tr><td style="padding:24px 36px 36px;">
            <p style="font-size:12px;line-height:1.6;color:#8a7780;margin:0;">Questions about your order? Just reply to this email and we'll help you out.</p>
            <p style="font-size:13px;line-height:1.6;color:#cbb8c0;margin:14px 0 0;">With love,<br/>SherryBerries</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
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

function passwordResetHtml({
  greeting,
  resetUrl,
}: {
  greeting: string;
  resetUrl: string;
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
            <h1 style="font-size:24px;line-height:1.25;color:#ffffff;margin:16px 0 12px;">Reset your password ✦</h1>
            <p style="font-size:15px;line-height:1.6;color:#cbb8c0;margin:0 0 8px;">${greeting}</p>
            <p style="font-size:15px;line-height:1.6;color:#cbb8c0;margin:0 0 24px;">We got a request to reset your SherryBerries password. Tap the button below to choose a new one.</p>
          </td></tr>
          <tr><td style="padding:0 36px 28px;">
            <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#ff4fa3,#d6266f);color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:0.14em;text-transform:uppercase;padding:16px 28px;border-radius:999px;">Reset my password</a>
          </td></tr>
          <tr><td style="padding:0 36px 36px;">
            <p style="font-size:12px;line-height:1.6;color:#8a7780;margin:0;">This link expires in 1 hour. If the button doesn't work, paste this link into your browser:</p>
            <p style="font-size:12px;line-height:1.6;color:#ff4fa3;word-break:break-all;margin:8px 0 0;">${resetUrl}</p>
            <p style="font-size:12px;line-height:1.6;color:#8a7780;margin:16px 0 0;">If you didn't request a password reset, you can safely ignore this email — your password won't change.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

// Escape user-supplied content before interpolating into the email HTML.
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function contactHtml({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): string {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeSubject = escapeHtml(subject);
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
  return `<!doctype html>
<html>
  <body style="margin:0;background:#0d0608;font-family:Helvetica,Arial,sans-serif;color:#f5e9ee;padding:32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;background:#160a10;border:1px solid rgba(255,79,163,0.18);border-radius:20px;overflow:hidden;">
          <tr><td style="padding:36px 36px 8px;">
            <div style="font-size:26px;letter-spacing:0.02em;color:#ffffff;">Sherry<span style="font-style:italic;color:#ff4fa3;">Berries</span></div>
          </td></tr>
          <tr><td style="padding:8px 36px 0;">
            <h1 style="font-size:22px;line-height:1.25;color:#ffffff;margin:16px 0 16px;">New contact message ✦</h1>
          </td></tr>
          <tr><td style="padding:0 36px 8px;">
            <p style="font-size:13px;line-height:1.6;color:#8a7780;margin:0 0 2px;text-transform:uppercase;letter-spacing:0.1em;">From</p>
            <p style="font-size:15px;line-height:1.6;color:#f5e9ee;margin:0 0 16px;">${safeName} &lt;<a href="mailto:${safeEmail}" style="color:#ff4fa3;text-decoration:none;">${safeEmail}</a>&gt;</p>
            <p style="font-size:13px;line-height:1.6;color:#8a7780;margin:0 0 2px;text-transform:uppercase;letter-spacing:0.1em;">Subject</p>
            <p style="font-size:15px;line-height:1.6;color:#f5e9ee;margin:0 0 16px;">${safeSubject}</p>
            <p style="font-size:13px;line-height:1.6;color:#8a7780;margin:0 0 2px;text-transform:uppercase;letter-spacing:0.1em;">Message</p>
            <p style="font-size:15px;line-height:1.7;color:#cbb8c0;margin:0 0 28px;">${safeMessage}</p>
          </td></tr>
          <tr><td style="padding:0 36px 36px;">
            <p style="font-size:12px;line-height:1.6;color:#8a7780;margin:0;">Reply to this email to respond to ${safeName} directly.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

// --- Bank transfer -----------------------------------------------------------
//
// Three emails, one per state change the customer needs to know about. The
// wording is deliberately careful: only the CONFIRMED one says money was
// received, because only that one is sent after an admin checked the account.
// The SUBMITTED one acknowledges the receipt and says verification is pending —
// telling a customer "payment received" on upload is the exact confusion this
// whole feature exists to prevent.

export type BankTransferEmailBase = {
  to: string;
  name: string | null;
  orderNumber: string;
  /** Pre-formatted, e.g. "$240.00 TTD". */
  amount: string;
};

/** Sent when the customer uploads proof of payment. Acknowledges only that. */
export async function sendReceiptSubmittedEmail({
  to,
  name,
  orderNumber,
  amount,
}: BankTransferEmailBase): Promise<{ ok: boolean; error?: string }> {
  const resend = getClient();
  if (!resend) return { ok: false, error: "RESEND_API_KEY is not configured." };
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi there,";
  const order = escapeHtml(orderNumber);
  const money = escapeHtml(amount);

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `[${orderNumber}] We've got your payment receipt`,
      html: bankTransferHtml({
        heading: "Payment receipt received",
        greeting,
        body: [
          `Thank you, Sweet Berry! We&rsquo;ve received your payment receipt for <strong style="color:#ffffff;">${order}</strong> (${money}).`,
          "We&rsquo;ll check the transfer against our bank account and confirm your order once the payment has arrived. Nothing else is needed from you right now &mdash; we&rsquo;ll email you as soon as it&rsquo;s verified.",
        ],
        note: "This confirms we received your receipt, not that the payment has cleared. We verify every transfer by hand.",
      }),
      text:
        `${greeting}\n\nWe've received your payment receipt for ${orderNumber} (${amount}).\n\n` +
        `We'll check the transfer against our bank account and confirm your order once the payment has arrived. Nothing else is needed from you right now.\n\n` +
        `This confirms we received your receipt, not that the payment has cleared — we verify every transfer by hand.`,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email." };
  }
}

/** Sent after an admin verified the funds arrived. This one is the receipt. */
export async function sendPaymentConfirmedEmail({
  to,
  name,
  orderNumber,
  amount,
}: BankTransferEmailBase): Promise<{ ok: boolean; error?: string }> {
  const resend = getClient();
  if (!resend) return { ok: false, error: "RESEND_API_KEY is not configured." };
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi there,";
  const order = escapeHtml(orderNumber);
  const money = escapeHtml(amount);

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `[${orderNumber}] Payment confirmed`,
      html: bankTransferHtml({
        heading: "Payment confirmed",
        greeting,
        body: [
          `We&rsquo;ve received your bank transfer of <strong style="color:#ffffff;">${money}</strong> for <strong style="color:#ffffff;">${order}</strong>. Thank you!`,
          "Your order is confirmed and now being prepared. We&rsquo;ll be in touch when it ships or is ready for pickup.",
        ],
        note: "Keep this email as your receipt.",
      }),
      text:
        `${greeting}\n\nWe've received your bank transfer of ${amount} for ${orderNumber}. Thank you!\n\n` +
        `Your order is confirmed and now being prepared. We'll be in touch when it ships or is ready for pickup.\n\n` +
        `Keep this email as your receipt.`,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email." };
  }
}

/** Sent when an admin could not verify a submitted receipt. */
export async function sendPaymentRejectedEmail({
  to,
  name,
  orderNumber,
  amount,
  reason,
  paymentUrl,
}: BankTransferEmailBase & { reason: string; paymentUrl: string }): Promise<{
  ok: boolean;
  error?: string;
}> {
  const resend = getClient();
  if (!resend) return { ok: false, error: "RESEND_API_KEY is not configured." };
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi there,";
  const order = escapeHtml(orderNumber);
  const money = escapeHtml(amount);

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to,
      subject: `[${orderNumber}] We couldn't verify your payment`,
      html: bankTransferHtml({
        heading: "We couldn&rsquo;t verify that payment",
        greeting,
        body: [
          `We looked for your transfer of <strong style="color:#ffffff;">${money}</strong> for <strong style="color:#ffffff;">${order}</strong> and couldn&rsquo;t confirm it.`,
          `<strong style="color:#ffffff;">Reason:</strong> ${escapeHtml(reason)}`,
          "You can upload a new receipt using the button below. If you think this is a mistake, just reply to this email and we&rsquo;ll sort it out.",
        ],
        note: "Your order is still being held for now — nothing has been cancelled.",
        actionUrl: paymentUrl,
        actionLabel: "Upload a new receipt",
      }),
      text:
        `${greeting}\n\nWe looked for your transfer of ${amount} for ${orderNumber} and couldn't confirm it.\n\n` +
        `Reason: ${reason}\n\nYou can upload a new receipt here:\n${paymentUrl}\n\n` +
        `If you think this is a mistake, reply to this email and we'll sort it out. Your order is still being held for now — nothing has been cancelled.`,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email." };
  }
}

/** One shell for all three, matching the verification and reset templates. */
function bankTransferHtml({
  heading,
  greeting,
  body,
  note,
  actionUrl,
  actionLabel,
}: {
  heading: string;
  greeting: string;
  /** Paragraphs of HTML. Callers escape customer-supplied values themselves. */
  body: string[];
  note?: string;
  actionUrl?: string;
  actionLabel?: string;
}): string {
  const paragraphs = body
    .map((p) => `<p style="font-size:15px;line-height:1.6;color:#cbb8c0;margin:0 0 14px;">${p}</p>`)
    .join("");

  const action =
    actionUrl && actionLabel
      ? `<tr><td style="padding:6px 36px 28px;">
            <a href="${actionUrl}" style="display:inline-block;background:linear-gradient(135deg,#ff4fa3,#d6266f);color:#ffffff;text-decoration:none;font-size:13px;font-weight:bold;letter-spacing:0.14em;text-transform:uppercase;padding:16px 28px;border-radius:999px;">${actionLabel}</a>
          </td></tr>`
      : "";

  const footer = note
    ? `<tr><td style="padding:0 36px 36px;">
            <p style="font-size:12px;line-height:1.6;color:#8a7780;margin:0;">${note}</p>
          </td></tr>`
    : "";

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
            <h1 style="font-size:24px;line-height:1.25;color:#ffffff;margin:16px 0 12px;">${heading}</h1>
            <p style="font-size:15px;line-height:1.6;color:#cbb8c0;margin:0 0 14px;">${greeting}</p>
            ${paragraphs}
          </td></tr>
          ${action}
          ${footer}
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
