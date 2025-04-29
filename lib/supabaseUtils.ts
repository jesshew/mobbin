import { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { SUPABASE_BUCKET_NAME } from '@/config';

const SCREENSHOT_BUCKET = SUPABASE_BUCKET_NAME || 'v6'
const SIGNED_URL_EXPIRY_SECONDS = 3600 // 1 hour

const ERROR_GENERATING_SIGNED_URL = 'Error generating signed URL';

interface SignedUrlResult {
    error: string | null;
    path: string | null;
    signedUrl: string;
}

// Cache structure for signed URLs
interface CachedUrl {
    signedUrl: string;
    expiresAt: number; // Store expiry timestamp in milliseconds
}

// Simple in-memory cache.
// Consider using a proper LRU cache library (e.g., 'lru-cache')
// to manage memory effectively by evicting least recently used items.
const signedUrlCache = new Map<string, CachedUrl>();

export function getScreenshotPath(url: string): string {
    // console.log('Extracting storage path from screenshot URL:', url);
    try {
      const parsedUrl = new URL(url);
    //   console.log('Parsed URL:', parsedUrl);
      // Example path: /storage/v1/object/public/screenshot/batch_123/image.jpg
      // We need the part after the bucket name: batch_123/image.jpg
      const pathParts = parsedUrl.pathname.split('/');
    //   console.log('Path parts:', pathParts);
      const bucketNameIndex = pathParts.findIndex(part => part === SCREENSHOT_BUCKET);
    //   console.log('Bucket name index:', bucketNameIndex);
  
      if (bucketNameIndex === -1 || bucketNameIndex + 1 >= pathParts.length) {
        console.error(`Bucket '${SCREENSHOT_BUCKET}' not found or path is incomplete in URL: ${url}`);
        throw new Error(`Invalid screenshot URL format: ${url}`);
      }
      // Join the parts after the bucket name
      const storagePath = pathParts.slice(bucketNameIndex + 1).join('/');
    //   console.log('Extracted storage path:', storagePath);
      return storagePath;
    } catch (e) {
      // Catch URL parsing errors as well
      console.error(`Error parsing screenshot URL '${url}':`, e);
      // Re-throw a more specific error or handle as needed
      throw new Error(`Invalid screenshot URL format: ${url}`);
    }
  }

//   
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
        // console.error(`Error generating signed URLs in bulk for bucket '${bucketName}':`, bulkUrlError);
        // Throw a specific error indicating bulk operation failure
        throw new Error(`${ERROR_GENERATING_SIGNED_URL}: Bulk operation failed.`);
    }

    if (!signedUrlsResult) {
        // This case should theoretically be covered by bulkUrlError, but added for robustness
        // console.error(`No data returned for signed URLs batch for bucket '${bucketName}', but no error reported.`);
        throw new Error(`${ERROR_GENERATING_SIGNED_URL}: No data returned from Supabase.`);
    }

    const signedUrlMap = new Map<string, string>();

    // Process results and populate the map, checking for individual errors
    for (let i = 0; i < signedUrlsResult.length; i++) {
        const item: SignedUrlResult = signedUrlsResult[i];
        const path = paths[i]; // Get the corresponding original path

        if (item.error) {
            // console.error(`Failed to generate signed URL for path: ${path} in bucket '${bucketName}'. Error: ${item.error}`);
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

//   
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
export async function getSignedUrls(
    supabase: SupabaseClient,
    paths: string[],
): Promise<Map<string, string>> {
    // console.log('getSignedUrls called with paths:', paths);
    if (paths.length === 0) {
        console.log('No paths provided, returning empty map');
        return new Map<string, string>(); // Return empty map if no paths
    }

    const signedUrlMap = new Map<string, string>();
    const pathsToFetch: string[] = [];
    const currentTime = Date.now(); // Get current time in milliseconds
    
    // 1. Check cache for valid, non-expired URLs
    for (const path of paths) {
        const cacheEntry = signedUrlCache.get(path);
        if (cacheEntry && cacheEntry.expiresAt > currentTime) {
            // Cache hit and not expired
            // console.log(`Cache hit for path: ${path}`);
            signedUrlMap.set(path, cacheEntry.signedUrl);
        } else {
            // Cache miss or expired
            pathsToFetch.push(path);
            // Remove expired entry if it exists
            if (cacheEntry) {
                signedUrlCache.delete(path);
            }
        }
    }

    // 2. Fetch missing URLs if any
    if (pathsToFetch.length > 0) {
        // console.log(`Fetching ${pathsToFetch.length} URLs from Supabase:`, pathsToFetch);
        const { data: signedUrlsResult, error: bulkUrlError } = await supabase
            .storage
            .from(SCREENSHOT_BUCKET)
            .createSignedUrls(pathsToFetch, SIGNED_URL_EXPIRY_SECONDS);

        if (bulkUrlError) {
            console.error(`Error generating signed URLs in bulk for bucket '${SCREENSHOT_BUCKET}':`, bulkUrlError);
            // Throw a specific error indicating bulk operation failure
            throw new Error(`${ERROR_GENERATING_SIGNED_URL}: Bulk operation failed.`);
        }
        // console.log(`Received ${signedUrlsResult.length} results from Supabase`);
        
        // Calculate expiry time for the newly fetched URLs
        const expiresAt = currentTime + SIGNED_URL_EXPIRY_SECONDS * 1000;

        // 3. Process results, update the final map, and update the cache
        for (let i = 0; i < signedUrlsResult.length; i++) {
            const item: SignedUrlResult = signedUrlsResult[i];
            // The path corresponds to the path requested in pathsToFetch
            const path = pathsToFetch[i];

            if (item.error || !item.signedUrl) {
                console.error(`Failed to generate signed URL for path: ${path} in bucket '${SCREENSHOT_BUCKET}'. Error: ${item.error}`);
                // Throw an error specific to the failing path, maintaining original behavior
                throw new Error(`${ERROR_GENERATING_SIGNED_URL} for path: ${path}. Reason: ${item.error} / missing URL`);
            }

            // Add the newly fetched URL to the result map
            signedUrlMap.set(path, item.signedUrl);

            // Add the newly fetched URL and its expiry time to the cache
            signedUrlCache.set(path, { signedUrl: item.signedUrl, expiresAt });
        }
    }
    
    // console.log(`signedUrlMap has ${signedUrlMap.size} entries:`, JSON.stringify(Object.fromEntries(signedUrlMap), null, 2));
    // Return the map containing both cached and newly fetched URLs
    return signedUrlMap;
} 