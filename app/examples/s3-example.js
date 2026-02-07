/**
 * S3 Storage Examples
 *
 * Examples of using S3-compatible object storage with ORCS.
 * Bun provides native S3 support with zero external dependencies.
 *
 * ORCS provides two ways to use S3:
 * 1. Object-oriented approach using S3Storage class
 * 2. Functional approach using convenience functions
 */

import {
  S3Storage,
  createS3Storage,
  s3file,
  s3upload,
  s3download,
  s3delete,
  s3exists,
  s3presign,
  s3list,
} from "../../src/index.js";

// ============================================================================
// Object-Oriented Approach
// ============================================================================

/**
 * Create a custom S3 storage instance
 */
export function createCustomStorage() {
  // Create storage with specific configuration
  const storage = createS3Storage({
    bucket: "my-bucket",
    region: "us-west-2",
    accessKeyId: "key",
    secretAccessKey: "secret",
  });

  return storage;
}

/**
 * Use storage instance for operations
 */
export async function objectOrientedExample() {
  const storage = new S3Storage();

  // Upload a file
  await storage.upload("data/config.json", JSON.stringify({ foo: "bar" }), {
    type: "application/json",
  });

  // Download and read as JSON
  const config = await storage.json("data/config.json");

  // Check if file exists
  const exists = await storage.exists("data/config.json");

  // Generate presigned URL
  const url = storage.presign("data/config.json", {
    expiresIn: 3600,
  });

  // List files
  const files = await storage.list({
    prefix: "data/",
    maxKeys: 100,
  });

  return { config, exists, url, files };
}

// ============================================================================
// Functional Approach (uses global storage instance)
// ============================================================================

// ============================================================================
// Basic File Operations
// ============================================================================

/**
 * Upload a file to S3
 */
export async function uploadExample() {
  // Upload JSON
  await s3upload("data/config.json", JSON.stringify({ setting: "value" }), {
    type: "application/json",
  });

  // Upload text
  await s3upload("documents/readme.txt", "Hello World!", {
    type: "text/plain",
  });

  // Upload with public access
  await s3upload("public/image.jpg", imageBuffer, {
    type: "image/jpeg",
    acl: "public-read",
  });
}

/**
 * Download a file from S3
 */
export async function downloadExample() {
  // Download as ArrayBuffer
  const buffer = await s3download("data/file.bin");

  // Download as text
  const file = s3file("documents/readme.txt");
  const text = await file.text();

  // Download as JSON
  const configFile = s3file("data/config.json");
  const config = await configFile.json();

  return { buffer, text, config };
}

/**
 * Check if file exists
 */
export async function existsExample() {
  const exists = await s3exists("data/file.txt");

  if (exists) {
    console.log("File exists!");
  }
}

/**
 * Delete a file
 */
export async function deleteExample() {
  await s3delete("old-files/temp.txt");
}

// ============================================================================
// Presigned URLs
// ============================================================================

/**
 * Generate presigned download URL
 */
export function presignedDownloadExample() {
  // Generate URL that expires in 1 hour
  const url = s3presign("documents/report.pdf", {
    expiresIn: 3600,
    contentDisposition: 'attachment; filename="report.pdf"',
  });

  return url;
}

/**
 * Generate presigned upload URL
 */
export function presignedUploadExample() {
  // Allow client to upload directly to S3
  const url = s3presign("uploads/user-file.jpg", {
    method: "PUT",
    expiresIn: 300, // 5 minutes
    acl: "private",
    contentType: "image/jpeg",
  });

  return url;
}

// ============================================================================
// Listing Files
// ============================================================================

/**
 * List files in a bucket
 */
export async function listExample() {
  // List all files (up to 1000)
  const all = await s3list();

  // List files with prefix
  const uploads = await s3list({
    prefix: "uploads/",
    maxKeys: 100,
  });

  // Paginate through results
  let results = await s3list({ prefix: "data/", maxKeys: 500 });

  while (results.isTruncated) {
    const lastKey = results.contents?.at(-1).key;
    results = await s3list({
      prefix: "data/",
      maxKeys: 500,
      startAfter: lastKey,
    });

    // Process results...
  }

  return { all, uploads };
}

// ============================================================================
// Advanced Operations
// ============================================================================

/**
 * Stream large file upload
 */
export async function streamUploadExample() {
  const file = s3file("videos/large-video.mp4");

  const writer = file.writer({
    type: "video/mp4",
    retry: 3, // Retry on network errors
    queueSize: 10, // Queue up to 10 requests
    partSize: 5 * 1024 * 1024, // 5MB chunks
  });

  // Write chunks
  for (const chunk of videoChunks) {
    writer.write(chunk);
    await writer.flush();
  }

  await writer.end();
}

/**
 * Stream large file download
 */
export async function streamDownloadExample() {
  const file = s3file("videos/large-video.mp4");
  const stream = file.stream();

  for await (const chunk of stream) {
    // Process chunk...
    console.log(`Received ${chunk.length} bytes`);
  }
}

/**
 * Partial file read
 */
export async function partialReadExample() {
  const file = s3file("logs/application.log");

  // Read only first 1024 bytes
  const preview = await file.slice(0, 1024).text();

  // Read a specific range
  const middle = await file.slice(1000, 2000).bytes();

  return { preview, middle };
}

// ============================================================================
// Integration with Controllers
// ============================================================================

/**
 * Example controller for file uploads
 */
export class FileUploadController {
  /**
   * Generate presigned upload URL for client
   */
  static async getUploadUrl(ctx) {
    const { filename, contentType } = ctx.body;

    // Generate unique path
    const path = `uploads/${Date.now()}-${filename}`;

    // Generate presigned URL
    const url = s3presign(path, {
      method: "PUT",
      expiresIn: 300,
      contentType,
      acl: "private",
    });

    return ctx.json({
      uploadUrl: url,
      path,
      expiresIn: 300,
    });
  }

  /**
   * Get presigned download URL
   */
  static async getDownloadUrl(ctx) {
    const { path } = ctx.params;

    // Verify file exists
    const exists = await s3exists(path);

    if (!exists) {
      ctx.abort(404, "File not found");
    }

    // Generate presigned URL
    const url = s3presign(path, {
      expiresIn: 3600,
    });

    return ctx.json({ downloadUrl: url });
  }

  /**
   * Upload file from request
   */
  static async upload(ctx) {
    const file = await ctx.req.formData().then((fd) => fd.get("file"));

    if (!file) {
      ctx.abort(400, "No file provided");
    }

    const path = `uploads/${Date.now()}-${file.name}`;

    await s3upload(path, file, {
      type: file.type,
    });

    return ctx.json({
      path,
      size: file.size,
      type: file.type,
    });
  }
}
