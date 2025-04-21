import { API_ENDPOINTS } from '@/lib/constants';

/**
 * Uploads a batch of image files for processing with associated metadata.
 * Sends files to the server along with a batch name and analysis type.
 * 
 * @param files - Array of image files to upload
 * @param batchName - Name to identify this batch of uploads
 * @param analysisType - Type of analysis to perform on the images
 * @returns Object indicating success/failure with optional error message
 */
export const uploadImageBatch = async (
  files: File[],
  batchName: string, 
  analysisType: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Package files and metadata into form data for upload
    const batchFormData = new FormData();
    files.forEach(imageFile => batchFormData.append('file', imageFile));
    batchFormData.append('batchName', batchName);
    batchFormData.append('analysisType', analysisType);

    // Send batch to server for processing
    const uploadResponse = await fetch(API_ENDPOINTS.UPLOAD, {
      method: 'POST',
      body: batchFormData,
      body: batchFormData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }

    // Log the response data
    console.log('Upload response JSON:', responseData);
    console.log('Upload response status:', uploadResponse.status);
    return { success: true };

  } catch (error) {
    console.error('Failed to upload image batch:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error during upload'
    };
  }
};