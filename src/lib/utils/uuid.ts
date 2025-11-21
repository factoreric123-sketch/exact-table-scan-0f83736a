/**
 * UUID generation utility with fallback for older browsers
 * Ensures compatibility while using modern APIs when available
 */

export function generateUUID(): string {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Generates a robust unique ID for temporary optimistic updates
 * Uses crypto.randomUUID() for guaranteed uniqueness
 */
export function generateTempId(): string {
  return `temp_${generateUUID()}`;
}
