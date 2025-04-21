import { API_ENDPOINTS } from '@/lib/constants';

export const uploadFiles = async (
  files: File[],
  batchName: string,
  analysisType: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const formData = new FormData();
    files.forEach(file => formData.append('file', file));
    formData.append('batchName', batchName);
    formData.append('analysisType', analysisType);

    const response = await fetch(API_ENDPOINTS.UPLOAD, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Upload failed');
    }
    return { success: true };
  } catch (error) {
    console.error('Upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}; 