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