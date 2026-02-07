/**
 * S3 Storage Manager
 *
 * Object-oriented wrapper around Bun's native S3 API.
 * Provides a consistent interface for working with S3-compatible object storage.
 */

import { S3Client } from "bun";

let storageInstance = null;

export class S3Storage {
  constructor(config = {}) {
    this.config = config;
    this.client = null;
  }

  /**
   * Get or create S3 client
   */
  getClient() {
    if (this.client) {
      return this.client;
    }

    // Use provided config or let Bun read from environment
    if (Object.keys(this.config).length > 0) {
      this.client = new S3Client(this.config);
    } else {
      this.client = new S3Client();
    }

    return this.client;
  }

  /**
   * Get a file reference from S3
   *
   * @param {string} path - Path to the file in S3
   * @returns {S3File} S3 file reference
   *
   * @example
   * const file = storage.file('uploads/image.jpg');
   * const data = await file.json();
   */
  file(path) {
    const client = this.getClient();
    return client.file(path);
  }

  /**
   * Upload a file to S3
   *
   * @param {string} path - Destination path in S3
   * @param {string|Uint8Array|Blob|Response} data - Data to upload
   * @param {Object} options - Upload options
   * @returns {Promise<number>} Number of bytes written
   *
   * @example
   * await storage.upload('uploads/data.json', JSON.stringify({ hello: 'world' }), {
   *   type: 'application/json',
   *   acl: 'public-read'
   * });
   */
  async upload(path, data, options = {}) {
    const file = this.file(path);

    return file.write(data, {
      type: options.type,
      contentType: options.contentType,
      contentEncoding: options.contentEncoding,
      contentDisposition: options.contentDisposition,
    });
  }

  /**
   * Download a file from S3
   *
   * @param {string} path - Path to file in S3
   * @returns {Promise<ArrayBuffer>} File data
   *
   * @example
   * const data = await storage.download('uploads/image.jpg');
   */
  async download(path) {
    const file = this.file(path);
    return file.arrayBuffer();
  }

  /**
   * Delete a file from S3
   *
   * @param {string} path - Path to file in S3
   * @returns {Promise<void>}
   *
   * @example
   * await storage.delete('uploads/old-file.jpg');
   */
  async delete(path) {
    const file = this.file(path);
    return file.delete();
  }

  /**
   * Check if a file exists in S3
   *
   * @param {string} path - Path to file in S3
   * @returns {Promise<boolean>}
   *
   * @example
   * const exists = await storage.exists('uploads/file.txt');
   */
  async exists(path) {
    const file = this.file(path);
    return file.exists();
  }

  /**
   * Get file size in S3
   *
   * @param {string} path - Path to file in S3
   * @returns {Promise<number>} File size in bytes
   *
   * @example
   * const size = await storage.size('uploads/video.mp4');
   */
  async size(path) {
    const client = this.getClient();
    return S3Client.size(path, client);
  }

  /**
   * Get file metadata from S3
   *
   * @param {string} path - Path to file in S3
   * @returns {Promise<Object>} File metadata
   *
   * @example
   * const stat = await storage.stat('uploads/file.txt');
   * console.log(stat.size, stat.lastModified, stat.etag);
   */
  async stat(path) {
    const client = this.getClient();
    return S3Client.stat(path, client);
  }

  /**
   * Generate a presigned URL for S3 file
   *
   * @param {string} path - Path to file in S3
   * @param {Object} options - Presign options
   * @returns {string} Presigned URL
   *
   * @example
   * // Generate download URL (expires in 1 hour)
   * const url = storage.presign('uploads/report.pdf', {
   *   expiresIn: 3600,
   *   contentDisposition: 'attachment; filename="report.pdf"'
   * });
   *
   * // Generate upload URL
   * const uploadUrl = storage.presign('uploads/new-file.jpg', {
   *   method: 'PUT',
   *   expiresIn: 300,
   *   acl: 'public-read'
   * });
   */
  presign(path, options = {}) {
    const file = this.file(path);
    return file.presign({
      expiresIn: options.expiresIn || 3600,
      method: options.method || "GET",
      acl: options.acl,
      contentType: options.contentType,
      contentDisposition: options.contentDisposition,
    });
  }

  /**
   * List objects in S3 bucket
   *
   * @param {Object} options - List options
   * @returns {Promise<Object>} List results
   *
   * @example
   * const result = await storage.list({ prefix: 'uploads/', maxKeys: 100 });
   * for (const obj of result.contents) {
   *   console.log(obj.key, obj.size);
   * }
   */
  async list(options = {}) {
    const client = this.getClient();
    return S3Client.list(
      {
        prefix: options.prefix,
        maxKeys: options.maxKeys || 1000,
        startAfter: options.startAfter,
        fetchOwner: options.fetchOwner || false,
      },
      client,
    );
  }

  /**
   * Copy a file within S3 or between buckets
   *
   * @param {string} source - Source path
   * @param {string} destination - Destination path
   * @param {Object} options - Copy options
   * @returns {Promise<number>} Number of bytes copied
   *
   * @example
   * await storage.copy('uploads/old.jpg', 'archive/old.jpg');
   */
  async copy(source, destination, options = {}) {
    const sourceFile = this.file(source);
    const data = await sourceFile.arrayBuffer();

    const destFile = this.file(destination);
    return destFile.write(data, options);
  }

  /**
   * Move a file within S3 (copy then delete)
   *
   * @param {string} source - Source path
   * @param {string} destination - Destination path
   * @param {Object} options - Move options
   * @returns {Promise<void>}
   *
   * @example
   * await storage.move('uploads/temp.jpg', 'uploads/final.jpg');
   */
  async move(source, destination, options = {}) {
    await this.copy(source, destination, options);
    await this.delete(source);
  }

  /**
   * Get public URL for an S3 file
   *
   * @param {string} path - Path to file in S3
   * @param {string} publicUrl - Base public URL (optional)
   * @returns {string} Public URL
   *
   * @example
   * const url = storage.url('uploads/image.jpg');
   * // Returns: https://bucket.s3.amazonaws.com/uploads/image.jpg
   */
  url(path, publicUrl = null) {
    const baseUrl =
      publicUrl ||
      this.config.publicUrl ||
      process.env.S3_PUBLIC_URL ||
      `https://${this.config.bucket || process.env.S3_BUCKET}.s3.${this.config.region || process.env.S3_REGION || "us-east-1"}.amazonaws.com`;

    return `${baseUrl}/${path}`;
  }

  /**
   * Write to S3 using Bun.write syntax
   *
   * @param {string} path - Path to file in S3
   * @param {*} data - Data to write
   * @param {Object} options - Write options
   * @returns {Promise<number>} Number of bytes written
   *
   * @example
   * await storage.write('data.json', JSON.stringify({ foo: 'bar' }));
   */
  async write(path, data, options = {}) {
    return this.upload(path, data, options);
  }

  /**
   * Read from S3 as text
   *
   * @param {string} path - Path to file in S3
   * @returns {Promise<string>} File contents as text
   *
   * @example
   * const text = await storage.text('documents/readme.txt');
   */
  async text(path) {
    const file = this.file(path);
    return file.text();
  }

  /**
   * Read from S3 as JSON
   *
   * @param {string} path - Path to file in S3
   * @returns {Promise<any>} Parsed JSON
   *
   * @example
   * const config = await storage.json('config.json');
   */
  async json(path) {
    const file = this.file(path);
    return file.json();
  }

  /**
   * Read from S3 as bytes
   *
   * @param {string} path - Path to file in S3
   * @returns {Promise<Uint8Array>} File contents as bytes
   *
   * @example
   * const bytes = await storage.bytes('image.jpg');
   */
  async bytes(path) {
    const file = this.file(path);
    return file.bytes();
  }
}

/**
 * Get the global S3 storage instance
 */
export function getS3Storage() {
  if (!storageInstance) {
    // Create instance from environment/config
    storageInstance = new S3Storage();
  }
  return storageInstance;
}

/**
 * Set the global S3 storage instance
 */
export function setS3Storage(storage) {
  storageInstance = storage;
}

/**
 * Create a new S3 storage instance with custom config
 */
export function createS3Storage(config) {
  return new S3Storage(config);
}
