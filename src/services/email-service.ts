'use server';

interface EmailArgs {
  to: string;
  subject: string;
  htmlContent: string;
  textContext?: string; // Optional plain text content
}

interface SendGridError {
  message: string;
  field: string | null;
  help: string | null;
}

interface SendGridResponseError {
  errors: SendGridError[];
}


export async function sendEmail({ to, subject, htmlContent, textContext }: EmailArgs): Promise<{ success: boolean; message?: string; error?: SendGridResponseError }> {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!sendgridApiKey || !sendgridFromEmail) {
    console.error('SendGrid API Key or From Email is not configured.');
    return { success: false, message: 'Email service is not configured.' };
  }

  const emailData = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: sendgridFromEmail },
    subject: subject,
    content: [
      { type: 'text/plain', value: textContext || htmlContent.replace(/<[^>]*>?/gm, '') }, // Fallback to stripped HTML
      { type: 'text/html', value: htmlContent },
    ],
  };

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (response.ok) { // status 202 Accepted
      return { success: true, message: 'Email sent successfully.' };
    } else {
      const errorData: SendGridResponseError = await response.json();
      console.error('SendGrid API Error:', errorData);
      return { success: false, message: `Failed to send email (status: ${response.status})`, error: errorData };
    }
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Network or unexpected error: ${errorMessage}` };
  }
}
