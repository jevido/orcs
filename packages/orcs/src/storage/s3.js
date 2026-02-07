/**
 * S3 Storage Helpers
 *
 * Convenience functions that delegate to the global S3Storage instance.
 * Provides backward compatibility and a functional API.
 */

import { getS3Storage } from "./s3-storage.js";

/**
 * Get an S3 file reference
 */
export function s3file(path) {
  return getS3Storage().file(path);
}

/**
 * Upload a file to S3
 */
export async function s3upload(path, data, options = {}) {
  return getS3Storage().upload(path, data, options);
}

/**
 * Download a file from S3
 */
export async function s3download(path) {
  return getS3Storage().download(path);
}

/**
 * Delete a file from S3
 */
export async function s3delete(path) {
  return getS3Storage().delete(path);
}

/**
 * Check if a file exists in S3
 */
export async function s3exists(path) {
  return getS3Storage().exists(path);
}

/**
 * Get file size in S3
 */
export async function s3size(path) {
  return getS3Storage().size(path);
}

/**
 * Get file metadata from S3
 */
export async function s3stat(path) {
  return getS3Storage().stat(path);
}

/**
 * Generate a presigned URL for S3 file
 */
export function s3presign(path, options = {}) {
  return getS3Storage().presign(path, options);
}

/**
 * List objects in S3 bucket
 */
export async function s3list(options = {}) {
  return getS3Storage().list(options);
}

/**
 * Copy a file within S3
 */
export async function s3copy(source, destination, options = {}) {
  return getS3Storage().copy(source, destination, options);
}

/**
 * Move a file within S3
 */
export async function s3move(source, destination, options = {}) {
  return getS3Storage().move(source, destination, options);
}

/**
 * Get public URL for an S3 file
 */
export function s3url(path, publicUrl = null) {
  return getS3Storage().url(path, publicUrl);
}

// Re-export S3Storage class and related functions
export {
  S3Storage,
  getS3Storage,
  setS3Storage,
  createS3Storage,
} from "./s3-storage.js";
