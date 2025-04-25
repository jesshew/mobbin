import { MAX_FILES_PER_BATCH } from './constants';

export const filterAndLimitImageFiles = (files: File[], existingFiles: File[] = []): File[] => {
  const imageFiles = files.filter((file) => file.type.startsWith('image/'));
  const limitedFiles = imageFiles.slice(0, MAX_FILES_PER_BATCH);
  const combinedFiles = [...existingFiles, ...limitedFiles].slice(0, MAX_FILES_PER_BATCH);
  return combinedFiles;
};

export const removeFileAtIndex = (files: File[], index: number): File[] => {
  const newFiles = [...files];
  newFiles.splice(index, 1);
  return newFiles;
}; 

/**
 * Cleans the raw text by removing unwanted formatting and normalizing it.
 *
 * @param rawText - The raw text string to clean.
 * @returns Cleaned text as a single string.
 */
export function cleanText(rawText: string): string {
  // Remove extra line breaks and normalize formatting
  return rawText
    .replace(/,\s*}/g, '}')           // remove trailing commas
    .replace(/,\s*]/g, ']')           // remove trailing commas
    .replace(/```json/g, '')           // remove ```json
    .replace(/```/g, '')              // remove ```
    // .replace(/\\/g, '');              // remove \
    // .replace(/\n/g, '');              // flatten into one line
}