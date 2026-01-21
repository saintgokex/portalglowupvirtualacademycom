/**
 * File validation utilities for secure file uploads
 * 
 * SECURITY NOTE: This provides client-side validation for UX purposes.
 * The real security is enforced by Supabase Storage policies and bucket configuration.
 * These checks prevent users from accidentally uploading invalid files.
 */

// Allowed file extensions and their MIME types
const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  // Documents
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  '.xls': ['application/vnd.ms-excel'],
  '.xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  '.txt': ['text/plain'],
  // Images
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
};

// Maximum file size: 10MB
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = 10;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file for upload
 * Checks: extension, MIME type, and file size
 */
export function validateFile(file: File): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Please choose a smaller file.`,
    };
  }

  // Check file size is not zero
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File appears to be empty. Please choose a valid file.',
    };
  }

  // Get file extension (lowercase)
  const fileName = file.name.toLowerCase();
  const lastDotIndex = fileName.lastIndexOf('.');
  
  if (lastDotIndex === -1) {
    return {
      valid: false,
      error: 'File must have an extension (e.g., .pdf, .docx).',
    };
  }

  const extension = fileName.slice(lastDotIndex);
  
  // Check if extension is allowed
  if (!ALLOWED_FILE_TYPES[extension]) {
    const allowedList = Object.keys(ALLOWED_FILE_TYPES).join(', ');
    return {
      valid: false,
      error: `File type "${extension}" is not allowed. Allowed types: ${allowedList}`,
    };
  }

  // Check MIME type matches expected types for this extension
  const allowedMimeTypes = ALLOWED_FILE_TYPES[extension];
  if (!allowedMimeTypes.includes(file.type) && file.type !== '') {
    // Some browsers may not report MIME type correctly, so we allow empty type
    // but warn if MIME type is present and doesn't match
    return {
      valid: false,
      error: `File content type "${file.type}" does not match expected type for ${extension} files.`,
    };
  }

  // Check for suspicious patterns in filename (path traversal prevention)
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return {
      valid: false,
      error: 'Invalid filename. Filenames cannot contain path characters.',
    };
  }

  return { valid: true };
}

/**
 * Sanitizes a filename for safe storage
 * Removes path characters and special characters
 */
export function sanitizeFilename(filename: string): string {
  // Get just the filename without any path
  const baseName = filename.split(/[/\\\\]/).pop() || filename;
  
  // Remove any characters that could be problematic
  // Keep alphanumeric, dots, dashes, underscores, and spaces
  return baseName.replace(/[^a-zA-Z0-9.\\-_ ]/g, '_');
}

/**
 * Gets a safe file extension from a filename
 */
export function getFileExtension(filename: string): string {
  const sanitized = sanitizeFilename(filename);
  const lastDotIndex = sanitized.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return sanitized.slice(lastDotIndex + 1).toLowerCase();
}

/**
 * Returns the accept string for file input elements
 */
export function getAcceptString(): string {
  return Object.keys(ALLOWED_FILE_TYPES).join(',');
}
