/**
 * Example Job
 *
 * This is an example background job. Copy this file to create your own jobs.
 *
 * @example
 * // Dispatch a job
 * await SendEmailJob.dispatch({ to: 'user@example.com', subject: 'Hello' });
 *
 * // Dispatch with delay
 * await SendEmailJob.dispatchAfter(60, { to: 'user@example.com' }); // 60 seconds
 */

import { Job } from "@jevido/orcs";

export class SendEmailJob extends Job {
  /**
   * Configure job behavior
   */
  static maxRetries = 3;
  static retryDelay = 60; // seconds
  static queue = "emails";
  static priority = 10;
  static timeout = 30; // seconds

  /**
   * Handle the job
   */
  async handle() {
    const { to, subject, body } = this.data;

    console.log(`Sending email to ${to}...`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);

    // Simulate sending email
    await this.sleep(1000);

    console.log(`Email sent successfully to ${to}`);
  }

  /**
   * Called when the job fails permanently
   */
  async failed(error) {
    console.error(`Failed to send email to ${this.data.to}: ${error.message}`);
    // Log to monitoring service, send alert, etc.
  }

  /**
   * Helper to sleep
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class ProcessImageJob extends Job {
  static maxRetries = 2;
  static queue = "images";
  static priority = 5;

  async handle() {
    const { imageUrl, operations } = this.data;

    console.log(`Processing image: ${imageUrl}`);
    console.log(`Operations: ${operations.join(", ")}`);

    // Simulate image processing
    await this.sleep(2000);

    console.log(`Image processed: ${imageUrl}`);
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
