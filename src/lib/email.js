// Email notifications via EmailJS (emailjs.com)
// Works directly from the browser - no backend needed

const EMAILJS_SERVICE_ID = 'service_ll8e48r';
const EMAILJS_TEMPLATE_ID = 'template_ytvelrh';
const EMAILJS_PUBLIC_KEY = 'FcnVYc5j7dZI4egjt';

// This admin email ALWAYS receives every notification
const ADMIN_EMAIL = 'debbydeskk@gmail.com';

async function sendEmail({ toEmails, subject, message }) {
  try {
    const recipients = [...new Set([ADMIN_EMAIL, ...toEmails].filter(Boolean))];
    const sends = recipients.map(email =>
      fetch('https://api.emailjs.com/api/v1.0/email/send', {
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
            from_name: 'ACE System Portal',
          },
        }),
      })
    );
    await Promise.all(sends);
    console.log('Notifications sent to:', recipients);
  } catch (err) {
    console.error('Email send error:', err);
  }
}

export async function notifyComment({ projectName, commenterName, commentText, coachEmail, clientEmail }) {
  await sendEmail({
    toEmails: [coachEmail, clientEmail],
    subject: `New comment on ${projectName}`,
    message: `A new comment has been posted on the ${projectName} portal.\n\nFrom: ${commenterName || 'Anonymous'}\nComment: "${commentText}"\n\nLog in to the portal to view and reply.\n\n— ACE System Portal`,
  });
}

export async function notifyUpload({ projectName, uploaderName, fileName, fileType, coachEmail, clientEmail }) {
  await sendEmail({
    toEmails: [coachEmail, clientEmail],
    subject: `New file uploaded on ${projectName}`,
    message: `A new file has been uploaded to the ${projectName} portal.\n\nFile: ${fileName}\nType: ${fileType}\nUploaded by: ${uploaderName || 'A user'}\n\nVisit the portal to view and download the file.\n\n— ACE System Portal`,
  });
}

export async function notifyProgress({ projectName, taskTitle, progress, coachEmail, clientEmail }) {
  await sendEmail({
    toEmails: [coachEmail, clientEmail],
    subject: `Progress update on ${projectName}`,
    message: `A task has been updated on the ${projectName} portal.\n\nTask: ${taskTitle}\nProgress: ${progress}% complete\n\nVisit the portal to view the full update.\n\n— ACE System Portal`,
  });
}

export async function notifyNewResource({ projectName, resourceTitle, resourceType, coachEmail, clientEmail }) {
  await sendEmail({
    toEmails: [coachEmail, clientEmail],
    subject: `New resource added on ${projectName}`,
    message: `A new resource has been added to the ${projectName} portal.\n\nTitle: ${resourceTitle}\nType: ${resourceType}\n\nVisit the portal Resources tab to access it.\n\n— ACE System Portal`,
  });
}
