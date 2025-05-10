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
    console.error('SendGrid API Key or From Email is not configured in environment variables.');
    return { success: false, message: 'Email service is not configured. Missing API key or From email.' };
  }

  const emailData = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: sendgridFromEmail }, // Using environment variable for 'from' email
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

    if (response.ok) { // status 202 Accepted by SendGrid
      return { success: true, message: 'Email sent successfully via SendGrid.' };
    } else {
      // Attempt to parse error response from SendGrid
      let errorData: SendGridResponseError = { errors: [{ message: `SendGrid API Error: ${response.statusText}`, field: null, help: null }]};
      try {
          errorData = await response.json();
      } catch (parseError) {
          console.error('Could not parse SendGrid error response:', parseError);
      }
      console.error('SendGrid API Error:', response.status, errorData);
      const firstErrorMessage = errorData.errors?.[0]?.message || `Failed to send email (status: ${response.status})`;
      return { success: false, message: firstErrorMessage, error: errorData };
    }
  } catch (error) {
    console.error('Error sending email via SendGrid:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: `Network or unexpected error: ${errorMessage}` };
  }
}
