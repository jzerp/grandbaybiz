import { esc } from './util.js';
import { CATEGORY_BY_KEY } from '../categories.js';

// Sends mail through Resend (https://resend.com). Without RESEND_API_KEY the message is only logged,
// which is what you want during local development. Never throws: a mail problem must not break a request.
export async function sendEmail(env, { to, subject, text, replyTo }) {
  const html = toHtml(text);
  if (!env.RESEND_API_KEY) {
    console.log(`[email not sent: no RESEND_API_KEY] to=${to} subject=${subject}\n${text}\n`);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, text, html, reply_to: replyTo || env.CONTACT_EMAIL }),
    });
    if (!res.ok) { console.error('email failed', res.status, await res.text()); return false; }
    return true;
  } catch (e) {
    console.error('email error', e);
    return false;
  }
}

function toHtml(text) {
  const body = esc(text).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>').replace(/\n/g, '<br>');
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5;color:#0E2B33">${body}</div>`;
}

const sign = (env) => `\nGrand Bay Biz\n${env.SITE_URL}\nQuestions? Reply to this email or write to ${env.CONTACT_EMAIL}.`;

export const mails = {
  submitted: (env, l, editUrl) => ({
    to: l.email,
    subject: 'We got your Grand Bay Biz listing',
    text: `Hi ${l.contact_name},\n\nThank you. We received the listing for ${l.name} and it is waiting for review. We will email you as soon as it is live.\n\nThis is your private link to change your details or photos at any time. Please keep this email and do not share the link:\n${editUrl}\n${sign(env)}`,
  }),
  adminNew: (env, l) => ({
    to: env.ADMIN_EMAIL,
    subject: `New listing to review: ${l.name}`,
    text: `${l.name} (${CATEGORY_BY_KEY[l.category]?.name || l.category}) was submitted by ${l.contact_name}.\n\nReview it here:\n${env.SITE_URL}/admin\n`,
  }),
  approved: (env, l, editUrl) => ({
    to: l.email,
    subject: `${l.name} is live on Grand Bay Biz`,
    text: `Hi ${l.contact_name},\n\nGood news: your listing is live.\n\nYour public page (share it with anyone):\n${env.SITE_URL}/${l.slug}\n\nYour private link to edit your listing or pause it at any time:\n${editUrl}\n\nChanges you make are reviewed before they appear, and your current listing stays public in the meantime.\n${sign(env)}`,
  }),
  rejected: (env, l, editUrl) => ({
    to: l.email,
    subject: `About your Grand Bay Biz listing`,
    text: `Hi ${l.contact_name},\n\nThank you for sending ${l.name}. We were not able to publish it as it was submitted.${l.admin_note ? `\n\nNote from the reviewer:\n${l.admin_note}` : ''}\n\nYou can update your listing and send it again here:\n${editUrl}\n${sign(env)}`,
  }),
  editReceived: (env, l) => ({
    to: l.email,
    subject: `We received your changes to ${l.name}`,
    text: `Hi ${l.contact_name},\n\nWe received your changes and they are waiting for review. Your current listing stays public until they are approved. We will email you when that happens.\n${sign(env)}`,
  }),
  adminEdit: (env, l) => ({
    to: env.ADMIN_EMAIL,
    subject: `Edit to review: ${l.name}`,
    text: `${l.contact_name} sent changes to the live listing for ${l.name}.\n\nReview them here:\n${env.SITE_URL}/admin\n`,
  }),
  editApproved: (env, l) => ({
    to: l.email,
    subject: `Your changes to ${l.name} are live`,
    text: `Hi ${l.contact_name},\n\nYour changes were approved and are now live:\n${env.SITE_URL}/${l.slug}\n${sign(env)}`,
  }),
  editRejected: (env, l, editUrl) => ({
    to: l.email,
    subject: `About your changes to ${l.name}`,
    text: `Hi ${l.contact_name},\n\nWe were not able to publish your latest changes. Your listing stays live as it was.${l.admin_note ? `\n\nNote from the reviewer:\n${l.admin_note}` : ''}\n\nYou can try again here:\n${editUrl}\n${sign(env)}`,
  }),
  resend: (env, rows) => ({
    to: rows[0].email,
    subject: 'Your Grand Bay Biz edit link',
    text: `Hi,\n\nYou asked for a new private edit link. Here ${rows.length === 1 ? 'it is' : 'they are'}:\n\n${rows.map((r) => `${r.name}\n${r.editUrl}`).join('\n\n')}\n\nThe old link no longer works. If you did not ask for this, you can ignore this email.\n${sign(env)}`,
  }),
};
