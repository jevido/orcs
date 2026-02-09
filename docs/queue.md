# Background Job Queue

ORCS includes a built-in job queue system for running tasks asynchronously in the background. Process emails, images, reports, and other time-consuming tasks without blocking your API responses.

## Creating Jobs

Create jobs by extending the `Job` class:

```js
// app/jobs/send-email-job.js
import { Job } from "../src/index.js";

export class SendEmailJob extends Job {
  // Configure job behavior
  static maxRetries = 3; // Retry failed jobs up to 3 times
  static retryDelay = 60; // Wait 60 seconds before retrying
  static queue = "emails"; // Queue name
  static priority = 10; // Higher = more important
  static timeout = 30; // Job timeout in seconds

  async handle() {
    const { to, subject, body } = this.data;

    // Send email
    await sendEmail(to, subject, body);
  }

  async failed(error) {
    // Called when job fails after all retries
    console.error(`Failed to send email: ${error.message}`);
  }
}
```

## Dispatching Jobs

Dispatch jobs to run in the background:

```js
import { SendEmailJob } from "./app/jobs/send-email-job.js";

// Dispatch immediately
await SendEmailJob.dispatch({
  to: "user@example.com",
  subject: "Welcome!",
  body: "Thanks for signing up",
});

// Dispatch with delay (in seconds)
await SendEmailJob.dispatchAfter(60, {
  to: "user@example.com",
  subject: "Reminder",
});

// Dispatch with custom options
await SendEmailJob.dispatch(
  { to: "user@example.com" },
  {
    queue: "high-priority",
    priority: 20,
    delay: 30,
  },
);
```

## Queue Drivers

ORCS supports multiple queue drivers:

**Memory Driver** (default) - Fast in-memory queue, good for development:

```bash
# .env
QUEUE_DRIVER=memory
```

**Database Driver** - Persistent queue that survives restarts:

```bash
# .env
QUEUE_DRIVER=database
```

The database driver automatically creates a `jobs` table to store queued jobs.

## Processing Jobs

Start a worker to process background jobs:

```bash
# Process jobs from default queue
bun orcs queue:work

# Process specific queues (in priority order)
bun orcs queue:work --queue high,default,low

# Limit processing
bun orcs queue:work --sleep 5 --max-jobs 100
```

Worker options:

- `--queue` - Comma-separated list of queues to process (in order)
- `--sleep` - Seconds to wait between polls when queue is empty
- `--max-jobs` - Maximum number of jobs to process before stopping

## Queue Management

**View queue statistics:**

```bash
bun orcs queue:stats
bun orcs queue:stats emails  # Specific queue
```

**Clear a queue:**

```bash
bun orcs queue:clear default --force
```

## Job Retries

Failed jobs are automatically retried with exponential backoff:

```js
export class ProcessImageJob extends Job {
  static maxRetries = 3; // Retry up to 3 times
  static retryDelay = 60; // Base delay in seconds

  async handle() {
    // Attempt 1: wait 60s before retry
    // Attempt 2: wait 120s before retry (60 * 2^1)
    // Attempt 3: wait 240s before retry (60 * 2^2)
  }
}
```

## Multiple Queues

Organize jobs into different queues with priorities:

```js
export class SendEmailJob extends Job {
  static queue = "emails";
  static priority = 10;
}

export class ProcessImageJob extends Job {
  static queue = "images";
  static priority = 5;
}

export class GenerateReportJob extends Job {
  static queue = "reports";
  static priority = 1;
}
```

Process queues in priority order:

```bash
bun orcs queue:work --queue emails,images,reports
```

## Configuration

Configure queue behavior in `config/queue.js` and `.env`:

```bash
# .env
QUEUE_DRIVER=memory
QUEUE_DEFAULT=default
QUEUE_WORKER_QUEUES=default,high,low
QUEUE_WORKER_SLEEP=3
QUEUE_WORKER_MAX_JOBS=
```

```js
// config/queue.js
export default {
  driver: "memory", // or "database"
  default: "default",
  worker: {
    queues: ["default"],
    sleep: 3,
    maxJobs: null,
  },
};
```

## Registering Jobs

Register your jobs with the worker so they can be processed:

```js
// app/providers/queue-service-provider.js
import { ServiceProvider } from "../../src/core/service-provider.js";
import { SendEmailJob } from "../jobs/send-email-job.js";
import { ProcessImageJob } from "../jobs/process-image-job.js";

export class QueueServiceProvider extends ServiceProvider {
  register() {
    // Register jobs with the application
    this.app.jobRegistry.set("SendEmailJob", SendEmailJob);
    this.app.jobRegistry.set("ProcessImageJob", ProcessImageJob);
  }
}
```

## Example: Email Notifications

```js
// app/jobs/send-welcome-email-job.js
export class SendWelcomeEmailJob extends Job {
  static queue = "emails";
  static maxRetries = 3;

  async handle() {
    const { userId, email, name } = this.data;

    await sendEmail({
      to: email,
      subject: "Welcome to our platform!",
      template: "welcome",
      data: { name },
    });

    // Update database
    await db
      .table("users")
      .where("id", userId)
      .update({ welcome_email_sent_at: new Date() });
  }

  async failed(error) {
    // Log failure for monitoring
    await db.table("failed_jobs").insert({
      job: "SendWelcomeEmailJob",
      data: JSON.stringify(this.data),
      error: error.message,
      failed_at: new Date(),
    });
  }
}

// In your controller
export class UserController {
  static async register(ctx) {
    const user = await createUser(ctx.body);

    // Dispatch welcome email in background
    await SendWelcomeEmailJob.dispatch({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    return ctx.json({ user }, 201);
  }
}
```

## Example: Image Processing

```js
export class ProcessImageJob extends Job {
  static queue = "images";
  static maxRetries = 2;
  static timeout = 120; // 2 minutes

  async handle() {
    const { imageId, operations } = this.data;

    const image = await loadImage(imageId);

    for (const op of operations) {
      switch (op.type) {
        case "resize":
          await resizeImage(image, op.width, op.height);
          break;
        case "thumbnail":
          await createThumbnail(image, op.size);
          break;
        case "watermark":
          await addWatermark(image, op.text);
          break;
      }
    }

    await saveImage(image, imageId);
  }
}

// Dispatch from controller
await ProcessImageJob.dispatch({
  imageId: upload.id,
  operations: [
    { type: "resize", width: 1920, height: 1080 },
    { type: "thumbnail", size: 200 },
    { type: "watermark", text: "© 2026" },
  ],
});
```
