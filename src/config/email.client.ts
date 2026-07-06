import { BrevoClient } from "@getbrevo/brevo";

export enum EmailProjectTemplate {
  NO_RELEASE = "no-release-notice",
  DRAFT_RELEASE = "draft-release-notice",
  STAGING_RELEASE = "staging-release-notice",
}

export function getTemplate(projectName: string, type: EmailProjectTemplate): string {
  const messages = {
    "no-release-notice": `<p>Your project <strong>${projectName}</strong> is scheduled for permanent deletion in <strong>7 days</strong>.</p>
    <p>To prevent deletion, simply create your first release. This will cancel the scheduled deletion and keep your project active.</p>
    <p>Projects whose initial release has already been deployed to Production do not receive these deletion notices.</p>`,

    "draft-release-notice": `<p>Your project <strong>${projectName}</strong> is scheduled for permanent deletion in <strong>7 days</strong>.</p>
    <p>Your initial release is currently in <strong>Draft</strong> status and has been inactive for an extended period. To prevent deletion, any operational activity on the release will cancel the scheduled deletion and keep your project active.</p>
    <p>Projects whose initial release has already been deployed to Production do not receive these deletion notices.</p>`,

    "staging-release-notice": `<p>Your project <strong>${projectName}</strong> is scheduled for permanent deletion in <strong>7 days</strong>.</p>
    <p>Your initial release is currently in <strong>Staging</strong> status and has been inactive for an extended period. To prevent deletion, any operational activity on the release will cancel the scheduled deletion and keep your project active.</p>
    <p>Projects whose initial release has already been deployed to Production do not receive these deletion notices.</p>`,
  };

  return messages[type];
}

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_SMTP_API_KEY,
});

export interface IEmailContentData {
  subject: string;
  body: string;
  recipientEmail: string;
}

export async function sendEmail(content: IEmailContentData) {
  const { recipientEmail, subject, body } = content;

  await brevo.transactionalEmails.sendTransacEmail({
    to: [{ email: recipientEmail }],
    subject: subject,
    htmlContent: body,
    sender: {
      name: process.env.BREVO_SMTP_SENDER_NAME,
      email: process.env.BREVO_SMTP_SENDER_EMAIL,
    },
  });
}
