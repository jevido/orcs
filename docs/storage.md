# S3 Object Storage

ORCS leverages Bun's native S3 support for seamless integration with S3-compatible object storage services. No external dependencies required - it's built right into Bun.

## Supported Services

- AWS S3
- Cloudflare R2
- DigitalOcean Spaces
- MinIO
- Supabase Storage
- Google Cloud Storage
- ...and any S3-compatible service

## Configuration

Configure S3 in your `.env` file:

```bash
# .env
S3_BUCKET=my-bucket
S3_ACCESS_KEY_ID=your-access-key
S3_SECRET_ACCESS_KEY=your-secret-key
S3_REGION=us-east-1

# For S3-compatible services, specify endpoint
# S3_ENDPOINT=https://account-id.r2.cloudflarestorage.com  # Cloudflare R2
# S3_ENDPOINT=https://nyc3.digitaloceanspaces.com          # DigitalOcean
# S3_ENDPOINT=http://localhost:9000                        # MinIO

# Optional
S3_PUBLIC_URL=https://cdn.example.com
S3_DEFAULT_ACL=private
```

## Basic Usage

ORCS provides two ways to work with S3:

**Object-Oriented Approach:**

```js
import { S3Storage, createS3Storage } from "./src/index.js";

// Use global storage instance (reads from environment)
const storage = new S3Storage();

// Upload a file
await storage.upload("documents/report.pdf", pdfBuffer, {
  type: "application/pdf",
  acl: "private",
});

// Download a file
const data = await storage.download("documents/report.pdf");

// Read as JSON
const config = await storage.json("data/config.json");

// Check if exists
const exists = await storage.exists("data/config.json");

// Delete file
await storage.delete("old-file.txt");

// Or create a custom storage instance
const customStorage = createS3Storage({
  bucket: "my-bucket",
  region: "us-west-2",
  accessKeyId: "key",
  secretAccessKey: "secret",
});
```

**Functional Approach:**

```js
import { s3upload, s3download, s3file, s3exists } from "./src/index.js";

// Upload a file
await s3upload("documents/report.pdf", pdfBuffer, {
  type: "application/pdf",
  acl: "private",
});

// Download a file
const data = await s3download("documents/report.pdf");

// Get file reference (lazy - no network request)
const file = s3file("data/config.json");
const config = await file.json();

// Check if exists
const exists = await s3exists("data/config.json");
```

## Presigned URLs

Generate secure, temporary URLs for uploads and downloads:

```js
// Download URL (expires in 1 hour)
const downloadUrl = s3presign("documents/report.pdf", {
  expiresIn: 3600,
  contentDisposition: 'attachment; filename="report.pdf"',
});

// Upload URL (client uploads directly to S3)
const uploadUrl = s3presign("uploads/file.jpg", {
  method: "PUT",
  expiresIn: 300, // 5 minutes
  acl: "public-read",
  contentType: "image/jpeg",
});

// Return URL to client
return ctx.json({ uploadUrl });
```

## Listing Files

```js
import { s3list } from "./src/index.js";

// List all files (up to 1000)
const files = await s3list();

// List with prefix
const uploads = await s3list({
  prefix: "uploads/",
  maxKeys: 100,
});

// Process results
for (const file of uploads.contents) {
  console.log(file.key, file.size, file.lastModified);
}

// Paginate if truncated
if (uploads.isTruncated) {
  const more = await s3list({
    prefix: "uploads/",
    startAfter: uploads.contents.at(-1).key,
  });
}
```

## Streaming Large Files

```js
// Upload large file in chunks
const file = s3file("videos/movie.mp4");
const writer = file.writer({
  type: "video/mp4",
  retry: 3,
  partSize: 5 * 1024 * 1024, // 5MB chunks
});

for (const chunk of chunks) {
  writer.write(chunk);
  await writer.flush();
}
await writer.end();

// Download as stream
const stream = file.stream();
for await (const chunk of stream) {
  // Process chunk
}
```

## Partial Reads

Read only part of a file without downloading the entire file:

```js
const file = s3file("logs/app.log");

// Read first 1KB
const preview = await file.slice(0, 1024).text();

// Read specific range
const middle = await file.slice(1000, 2000).bytes();
```

## File Operations

```js
import { s3exists, s3size, s3stat, s3copy, s3move } from "./src/index.js";

// Check existence
const exists = await s3exists("uploads/file.txt");

// Get file size
const bytes = await s3size("uploads/video.mp4");

// Get metadata
const stat = await s3stat("uploads/file.txt");
console.log(stat.size, stat.etag, stat.lastModified);

// Copy file
await s3copy("uploads/temp.jpg", "archive/temp.jpg");

// Move file (copy + delete)
await s3move("uploads/temp.jpg", "uploads/final.jpg");
```

## Example: File Upload Controller

```js
import { s3upload, s3presign, s3exists } from "./src/index.js";

export class FileController {
  // Generate presigned upload URL
  static async getUploadUrl(ctx) {
    const { filename, contentType } = ctx.body;
    const path = `uploads/${Date.now()}-${filename}`;

    const url = s3presign(path, {
      method: "PUT",
      expiresIn: 300,
      contentType,
    });

    return ctx.json({ uploadUrl: url, path });
  }

  // Direct upload (through your server)
  static async upload(ctx) {
    const formData = await ctx.req.formData();
    const file = formData.get("file");

    const path = `uploads/${Date.now()}-${file.name}`;
    await s3upload(path, file, { type: file.type });

    return ctx.json({ path, size: file.size }, 201);
  }

  // Get download URL
  static async getDownloadUrl(ctx) {
    const { path } = ctx.params;

    if (!(await s3exists(path))) {
      ctx.abort(404, "File not found");
    }

    const url = s3presign(path, { expiresIn: 3600 });
    return ctx.json({ downloadUrl: url });
  }
}
```

## Using with Different Providers

**Cloudflare R2:**

```bash
S3_ENDPOINT=https://account-id.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=your-r2-access-key
S3_SECRET_ACCESS_KEY=your-r2-secret
S3_BUCKET=my-r2-bucket
```

**MinIO (Local Development):**

```bash
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=local-bucket
```

**DigitalOcean Spaces:**

```bash
S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
S3_ACCESS_KEY_ID=your-spaces-key
S3_SECRET_ACCESS_KEY=your-spaces-secret
S3_BUCKET=my-space
```

## Performance

Bun's native S3 implementation is highly optimized:

- Zero external dependencies
- Automatic multipart uploads for large files
- Built-in retry logic
- Streaming support for memory efficiency
- Native async/await - no callback hell

See the [full Bun S3 documentation](https://bun.sh/docs/api/s3) for advanced features like virtual hosted-style URLs, custom headers, and more.
