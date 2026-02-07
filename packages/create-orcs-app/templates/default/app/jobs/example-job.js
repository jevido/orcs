import { Job } from "@jevido/orcs";

/**
 * Example Job
 *
 * This is a sample background job.
 * Jobs are useful for tasks like sending emails, processing data, etc.
 */
export class ExampleJob extends Job {
  /**
   * Execute the job
   */
  async handle() {
    const { message } = this.data;

    console.log(`Processing job: ${message}`);

    // Your job logic here
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`Job completed: ${message}`);
  }

  /**
   * Handle job failure
   */
  async failed(error) {
    console.error(`Job failed: ${error.message}`);
  }
}
