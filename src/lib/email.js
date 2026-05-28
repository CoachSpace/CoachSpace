// Email notifications via EmailJS
const EMAILJS_SERVICE_ID = 'service_ll8e48r';
const EMAILJS_TEMPLATE_ID = 'template_ytvelrh';
const EMAILJS_PUBLIC_KEY = 'FcnVYc5j7dZI4egjt';
const ADMIN_EMAIL = 'debbydeskk@gmail.com';

async function sendToOne(email, subject, message) {
  if (!email || !email.includes('@')) {
    console.warn('Skipping invalid email:', email);
    return;
  }
  try {
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          to_email: email,
          subject: subject,
          message: message,
        },
      }),
    });
    const text = await res.text();
    console.log(`Email to ${email}: status=${res.status} response=${text}`);
  } catch (err) {
    console.error(`Email to ${email} failed:`, err);
  }
}

async function sendNotification(clientEmail, subject, message) {
  console.log('Sending notifications. Client email:', clientEmail);
  // Always send to admin
  await sendToOne(ADMIN_EMAIL, subject, message);
  // Send to client only if different from admin and valid
  if (clientEmail && clientEmail !== ADMIN_EMAIL && clientEmail.includes('@')) {
    await sendToOne(clientEmail, subject, message);
  } else {
    console.warn('Client email missing or invalid:', clientEmail);
  }
}

export async function notifyComment({ projectName, commenterName, commentText, coachEmail, clientEmail }) {
  const subject = `New comment on ${projectName}`;
  const message = `A new comment has been posted on the ${projectName} portal.\n\nFrom: ${commenterName || 'Anonymous'}\nComment: "${commentText}"\n\nLog in to view and reply.\n\n— ACE System Portal`;
  await sendNotification(clientEmail, subject, message);
}

export async function notifyUpload({ projectName, uploaderName, fileName, fileType, coachEmail, clientEmail }) {
  const subject = `New file uploaded on ${projectName}`;
  const message = `A new file was uploaded to the ${projectName} portal.\n\nFile: ${fileName}\nType: ${fileType}\nUploaded by: ${uploaderName || 'A user'}\n\n— ACE System Portal`;
  await sendNotification(clientEmail, subject, message);
}

export async function notifyProgress({ projectName, taskTitle, progress, coachEmail, clientEmail }) {
  const subject = `Progress update on ${projectName}`;
  const message = `A task was updated on the ${projectName} portal.\n\nTask: ${taskTitle}\nProgress: ${progress}% complete\n\n— ACE System Portal`;
  await sendNotification(clientEmail, subject, message);
}

export async function notifyNewResource({ projectName, resourceTitle, resourceType, coachEmail, clientEmail }) {
  const subject = `New resource added on ${projectName}`;
  const message = `A new resource was added to the ${projectName} portal.\n\nTitle: ${resourceTitle}\nType: ${resourceType}\n\nVisit the Resources tab to access it.\n\n— ACE System Portal`;
  await sendNotification(clientEmail, subject, message);
}
