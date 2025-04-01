/**
 * Uploads an image to the server for processing
 * @param file - The file to upload
 * @returns The server response with the processed image information
 */
export async function uploadAndProcessImage(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Failed to upload image')
  }

  return response.json()
} 