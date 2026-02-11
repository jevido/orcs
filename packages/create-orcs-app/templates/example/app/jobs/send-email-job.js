import { Job } from "@jevido/orcs";

/**
 * Send Email Job
 *
 * Example job for sending emails asynchronously.
 * Can be dispatched from controllers to send emails in the background.
 */
export class SendEmailJob extends Job {
  /**
   * Execute the job
   */
  async handle() {
    const { to, subject, body } = this.data;

    console.log(`📧 Sending email to ${to}...`);
    console.log(`   Subject: ${subject}`);

    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production, use an email service:
    // await sendEmail({ to, subject, body });

    console.log(`Email sent to ${to}`);
  }

  /**
   * Handle job failure
   */
  async failed(error) {
    console.error(`Failed to send email: ${error.message}`);

    // Could log to monitoring service, send alert, etc.
  }
}
