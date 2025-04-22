import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';

const ERROR_GENERATING_SIGNED_URL = 'Error generating signed URL';

interface SignedUrlResult {
    error: string | null;
    path: string | null;
    signedUrl: string;
}

/**
 * Generates signed URLs for a list of object paths within a Supabase storage bucket.
 * Throws an error if any URL generation fails.
 * @param supabase - The Supabase client instance.
 * @param bucketName - The name of the storage bucket.
 * @param paths - An array of object paths within the bucket.
 * @param expiresIn - The duration in seconds for which the signed URLs will be valid.
 * @returns A Promise resolving to a Map where keys are the original paths and values are the signed URLs.
 * @throws Throws an error if Supabase client fails to generate URLs or if any individual URL generation fails.
 */
export async function generateSignedUrls(
    supabase: SupabaseClient,
    bucketName: string,
    paths: string[],
    expiresIn: number
): Promise<Map<string, string>> {
    if (paths.length === 0) {
        return new Map<string, string>(); // Return empty map if no paths
    }

    const { data: signedUrlsResult, error: bulkUrlError } = await supabase
        .storage
        .from(bucketName)
        .createSignedUrls(paths, expiresIn);

    if (bulkUrlError) {
        console.error(`Error generating signed URLs in bulk for bucket '${bucketName}':`, bulkUrlError);
        // Throw a specific error indicating bulk operation failure
        throw new Error(`${ERROR_GENERATING_SIGNED_URL}: Bulk operation failed.`);
    }

    if (!signedUrlsResult) {
        // This case should theoretically be covered by bulkUrlError, but added for robustness
        console.error(`No data returned for signed URLs batch for bucket '${bucketName}', but no error reported.`);
        throw new Error(`${ERROR_GENERATING_SIGNED_URL}: No data returned from Supabase.`);
    }

    const signedUrlMap = new Map<string, string>();

    // Process results and populate the map, checking for individual errors
    for (let i = 0; i < signedUrlsResult.length; i++) {
        const item: SignedUrlResult = signedUrlsResult[i];
        const path = paths[i]; // Get the corresponding original path

        if (item.error) {
            console.error(`Failed to generate signed URL for path: ${path} in bucket '${bucketName}'. Error: ${item.error}`);
            // Throw an error specific to the failing path
            throw new Error(`${ERROR_GENERATING_SIGNED_URL} for path: ${path}. Reason: ${item.error}`);
        }

        if (!item.signedUrl) {
            // Handle cases where there's no error but also no URL (should be unlikely)
            console.error(`No signed URL returned for path: ${path} in bucket '${bucketName}', although no specific error was reported.`);
            throw new Error(`${ERROR_GENERATING_SIGNED_URL} - missing URL for path: ${path}`);
        }

        // Map the original path to the signed URL
        signedUrlMap.set(path, item.signedUrl);
    }

    return signedUrlMap;
} 