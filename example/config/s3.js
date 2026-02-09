/**
 * S3 Configuration
 *
 * Configure S3-compatible object storage for your application.
 * Bun provides native S3 support for AWS S3, Cloudflare R2, DigitalOcean Spaces,
 * MinIO, and other S3-compatible services.
 */

export default {
  /*
  |--------------------------------------------------------------------------
  | Default S3 Bucket
  |--------------------------------------------------------------------------
  |
  | The default S3 bucket to use for file storage.
  |
  */
  bucket: Bun.env.S3_BUCKET || Bun.env.AWS_BUCKET,

  /*
  |--------------------------------------------------------------------------
  | S3 Access Credentials
  |--------------------------------------------------------------------------
  |
  | Your S3 access key ID and secret access key.
  | These are automatically read from environment variables.
  |
  */
  accessKeyId: Bun.env.S3_ACCESS_KEY_ID || Bun.env.AWS_ACCESS_KEY_ID,
  secretAccessKey:
    Bun.env.S3_SECRET_ACCESS_KEY || Bun.env.AWS_SECRET_ACCESS_KEY,

  /*
  |--------------------------------------------------------------------------
  | Session Token (Optional)
  |--------------------------------------------------------------------------
  |
  | Session token for temporary credentials (e.g., from AWS STS).
  |
  */
  sessionToken: Bun.env.S3_SESSION_TOKEN || Bun.env.AWS_SESSION_TOKEN,

  /*
  |--------------------------------------------------------------------------
  | S3 Region
  |--------------------------------------------------------------------------
  |
  | The AWS region where your S3 bucket is located.
  | Not needed if you specify an endpoint URL.
  |
  */
  region: Bun.env.S3_REGION || Bun.env.AWS_REGION || "us-east-1",

  /*
  |--------------------------------------------------------------------------
  | S3 Endpoint (Optional)
  |--------------------------------------------------------------------------
  |
  | Custom endpoint URL for S3-compatible services.
  |
  | Examples:
  | - AWS S3: https://s3.<region>.amazonaws.com (auto-detected)
  | - Cloudflare R2: https://<account-id>.r2.cloudflarestorage.com
  | - DigitalOcean Spaces: https://<region>.digitaloceanspaces.com
  | - MinIO: http://localhost:9000
  | - Supabase: https://<account-id>.supabase.co/storage/v1/s3
  |
  */
  endpoint: Bun.env.S3_ENDPOINT || Bun.env.AWS_ENDPOINT,

  /*
  |--------------------------------------------------------------------------
  | Virtual Hosted Style
  |--------------------------------------------------------------------------
  |
  | Enable virtual hosted-style URLs (bucket in hostname instead of path).
  | Required for some S3-compatible services.
  |
  */
  virtualHostedStyle: Bun.env.S3_VIRTUAL_HOSTED_STYLE === "true" || false,

  /*
  |--------------------------------------------------------------------------
  | Default ACL
  |--------------------------------------------------------------------------
  |
  | Default access control list for uploaded files.
  |
  | Options:
  | - private: Only bucket owner has access
  | - public-read: Anyone can read
  | - public-read-write: Anyone can read and write
  | - authenticated-read: Authenticated users can read
  |
  */
  acl: Bun.env.S3_DEFAULT_ACL || "private",

  /*
  |--------------------------------------------------------------------------
  | Public URL Base
  |--------------------------------------------------------------------------
  |
  | Base URL for accessing public S3 files.
  | Used for generating public URLs for uploaded files.
  |
  */
  publicUrl: Bun.env.S3_PUBLIC_URL,
};
