// Email notifications via Resend (resend.com)
// Free tier: 3,000 emails/month

const RESEND_API_KEY = process.env.REACT_APP_RESEND_API_KEY;
const FROM_EMAIL = process.env.REACT_APP_FROM_EMAIL || 'onboarding@resend.dev';

// This admin email ALWAYS receives every notification
const ADMIN_EMAIL = 'debbydeskk@gmail.com';

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn('Resend API key not set — email not sent.');
    return;
  }
  try {
    // Always include admin email, merge with any other recipients, remove duplicates and empty values
    const recipients = [...new Set([ADMIN_EMAIL, ...(Array.isArray(to) ? to : [to])].filter(Boolean))];

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `ACE System Portal <${FROM_EMAIL}>`,
        to: recipients,
        subject,
        html,
      }),
    });
  } catch (err) {
    console.error('Email send error:', err);
  }
}

function baseTemplate(content) {
  return `
    <div style="font-family: 'Georgia', serif; max-width: 580px; margin: 0 auto; background: #FFF8F6; border: 1px solid #EAD7D9; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #4B0F1E, #7a2236); padding: 28px 32px;">
        <h1 style="color: #fff; margin: 0; font-size: 1.4rem; letter-spacing: 0.04em;">✦ ACE SYSTEM PORTAL</h1>
        <p style="color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 0.85rem; font-family: sans-serif;">Client Project Management</p>
      </div>
      <div style="padding: 28px 32px; font-family: sans-serif; color: #2B1B1F; font-size: 0.9rem; line-height: 1.7;">
        ${content}
      </div>
      <div style="padding: 16px 32px; border-top: 1px solid #EAD7D9; font-size: 0.75rem; color: #B76E79; font-family: sans-serif; text-align: center;">
        ACE System Portal · Automated notification
      </div>
    </div>
  `;
}

export async function notifyComment({ projectName, clientName, commenterName, commentText, coachEmail, clientEmail }) {
  const subject = `💬 New comment on ${projectName}`;
  const html = baseTemplate(`
    <p>Hi there,</p>
    <p>A new comment has been posted on the <strong>${projectName}</strong> portal.</p>
    <div style="background: #fff; border-left: 4px solid #F6C7CF; border-radius: 6px; padding: 14px 18px; margin: 16px 0;">
      <p style="margin: 0 0 6px; font-weight: 600; color: #4B0F1E;">${commenterName || 'Anonymous'}</p>
      <p style="margin: 0; color: #5a4a4e;">${commentText}</p>
    </div>
    <p>Log in to the portal to view and reply.</p>
  `);
  await sendEmail({ to: [coachEmail, clientEmail], subject, html });
}

export async function notifyUpload({ projectName, uploaderName, fileName, fileType, coachEmail, clientEmail }) {
  const subject = `📎 New file uploaded on ${projectName}`;
  const html = baseTemplate(`
    <p>Hi there,</p>
    <p>A new file has been uploaded to the <strong>${projectName}</strong> portal.</p>
    <div style="background: #fff; border-left: 4px solid #F6C7CF; border-radius: 6px; padding: 14px 18px; margin: 16px 0;">
      <p style="margin: 0 0 4px;"><strong>File:</strong> ${fileName}</p>
      <p style="margin: 0 0 4px;"><strong>Type:</strong> ${fileType}</p>
      <p style="margin: 0;"><strong>Uploaded by:</strong> ${uploaderName || 'A user'}</p>
    </div>
    <p>Visit the portal to view and download the file.</p>
  `);
  await sendEmail({ to: [coachEmail, clientEmail], subject, html });
}

export async function notifyProgress({ projectName, taskTitle, progress, coachEmail, clientEmail }) {
  const subject = `📋 Progress update on ${projectName}`;
  const html = baseTemplate(`
    <p>Hi there,</p>
    <p>A task has been updated on the <strong>${projectName}</strong> portal.</p>
    <div style="background: #fff; border-left: 4px solid #F6C7CF; border-radius: 6px; padding: 14px 18px; margin: 16px 0;">
      <p style="margin: 0 0 8px;"><strong>${taskTitle}</strong></p>
      <div style="background: #EAD7D9; border-radius: 4px; height: 10px; overflow: hidden;">
        <div style="background: linear-gradient(90deg, #F6C7CF, #4B0F1E); width: ${progress}%; height: 100%;"></div>
      </div>
      <p style="margin: 8px 0 0; font-size: 0.85rem; color: #B76E79;">${progress}% complete</p>
    </div>
  `);
  await sendEmail({ to: [coachEmail, clientEmail], subject, html });
}

export async function notifyNewResource({ projectName, resourceTitle, resourceType, coachEmail, clientEmail }) {
  const subject = `📦 New resource added on ${projectName}`;
  const html = baseTemplate(`
    <p>Hi there,</p>
    <p>A new resource has been added to the <strong>${projectName}</strong> portal.</p>
    <div style="background: #fff; border-left: 4px solid #F6C7CF; border-radius: 6px; padding: 14px 18px; margin: 16px 0;">
      <p style="margin: 0 0 4px;"><strong>${resourceTitle}</strong></p>
      <p style="margin: 0; color: #B76E79; font-size: 0.85rem;">${resourceType}</p>
    </div>
    <p>Visit the portal's Resources tab to access it.</p>
  `);
  await sendEmail({ to: [coachEmail, clientEmail], subject, html });
}
