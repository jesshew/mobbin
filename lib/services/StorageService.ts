import { LRUCache } from 'lru-cache';
import { DatabaseService } from './DatabaseService'; // Assuming DatabaseService exists here
// import { StorageCacheRepository } from '../repositories/StorageCacheRepository'; // Optional: If DB persistence is needed
// import { StatusEventRepository } from '../repositories/StatusEventRepository'; // Optional: If logging is needed
import { SUPABASE_BUCKET_NAME } from '@/config';
const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour - Align with Supabase default and previous usage
// const SCREENSHOT_BUCKET = 'screenshot'; // As identified in batches.ts
const SCREENSHOT_BUCKET = SUPABASE_BUCKET_NAME || 'v4'  ;
const ERROR_GENERATING_SIGNED_URL = 'Error generating signed URL';
const ERROR_GENERATING_BATCH_SIGNED_URLS = 'Error generating one or more signed URLs in batch';

// Configure cache options
// TTL is in milliseconds, so multiply expiry seconds by 1000
const cacheOptions = {
  max: 500, // Maximum number of items in cache
  ttl: SIGNED_URL_EXPIRY_SECONDS * 1000, // Use Supabase expiry for cache TTL
};

export class StorageService {
  private cache: LRUCache<string, string>;
  private databaseService: DatabaseService;
  // private storageCacheRepository: StorageCacheRepository; // Optional
  // private statusEventRepository: StatusEventRepository;   // Optional

  constructor(
    databaseService: DatabaseService,
    // storageCacheRepository?: StorageCacheRepository, // Optional
    // statusEventRepository?: StatusEventRepository    // Optional
  ) {
    this.databaseService = databaseService;
    this.cache = new LRUCache<string, string>(cacheOptions);
    // if (storageCacheRepository) this.storageCacheRepository = storageCacheRepository; // Optional
    // if (statusEventRepository) this.statusEventRepository = statusEventRepository;     // Optional
  }

  /**
   * Gets a Supabase signed URL for a single file path, utilizing an LRU cache.
   * @param filePath - The full path to the file in the Supabase storage bucket.
   * @returns A promise that resolves with the signed URL string.
   * @throws Error if the signed URL generation fails.
   */
  async getSignedUrl(filePath: string): Promise<string> {
    // Check cache first
    const cachedUrl = this.cache.get(filePath);
    if (cachedUrl) {
      // Optional: Log cache hit
      // await this.statusEventRepository?.create({ event: 'CACHE_HIT', details: { filePath } });
      return cachedUrl;
    }

    // Optional: Log cache miss
    // await this.statusEventRepository?.create({ event: 'CACHE_MISS', details: { filePath } });

    // Fetch from Supabase if not in cache or expired
    const supabase = this.databaseService.getClient();
    const { data, error } = await supabase.storage
      .from(SCREENSHOT_BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY_SECONDS);

    if (error) {
      console.error(`${ERROR_GENERATING_SIGNED_URL} for ${filePath}:`, error);
      // Optional: Log failure event
      // await this.statusEventRepository?.create({ event: 'SIGNED_URL_FAIL', details: { filePath, error: error.message } });
      throw new Error(`${ERROR_GENERATING_SIGNED_URL}: ${error.message}`);
    }

    if (!data?.signedUrl) {
        // This case should theoretically not happen if error is null, but good practice to check
        console.error(`Generated signed URL data is unexpectedly null for ${filePath}`);
        throw new Error(ERROR_GENERATING_SIGNED_URL);
    }

    const signedUrl = data.signedUrl;

    // Add to cache
    this.cache.set(filePath, signedUrl);

    // Optional: Persist cache entry to DB via repository
    // await this.databaseService.runTransaction(async (txClient) => {
    //   await this.storageCacheRepository?.upsert(
    //      { filePath, signedUrl, expiresAt: new Date(Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000) },
    //      txClient // Pass transaction client if repository supports it
    //   );
    // });

    return signedUrl;
  }

  /**
   * Gets Supabase signed URLs for multiple file paths, utilizing an LRU cache
   * and fetching missing URLs in parallel.
   * @param filePaths - An array of full file paths in the Supabase storage bucket.
   * @returns A promise that resolves with a record mapping file paths to signed URLs.
   * @throws Error if any signed URL generation fails.
   */
  async getSignedUrls(filePaths: string[]): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    const pathsToFetch: string[] = [];

    // Check cache for each path
    for (const filePath of filePaths) {
      const cachedUrl = this.cache.get(filePath);
      if (cachedUrl) {
        results[filePath] = cachedUrl;
        // Optional: Log cache hit
        // await this.statusEventRepository?.create({ event: 'CACHE_HIT', details: { filePath } });
      } else {
        pathsToFetch.push(filePath);
        // Optional: Log cache miss
        // await this.statusEventRepository?.create({ event: 'CACHE_MISS', details: { filePath } });
      }
    }

    // Fetch missing URLs in parallel if any
    if (pathsToFetch.length > 0) {
        const supabase = this.databaseService.getClient();
        const promises = pathsToFetch.map(async (filePath) => {
            const { data, error } = await supabase.storage
                .from(SCREENSHOT_BUCKET)
                .createSignedUrl(filePath, SIGNED_URL_EXPIRY_SECONDS);

            if (error) {
                console.error(`${ERROR_GENERATING_SIGNED_URL} for ${filePath}:`, error);
                // Optional: Log failure event
                // await this.statusEventRepository?.create({ event: 'SIGNED_URL_FAIL', details: { filePath, error: error.message } });
                // We throw here to ensure Promise.all rejects if any URL fails
                throw new Error(`Failed to get signed URL for ${filePath}: ${error.message}`);
            }

             if (!data?.signedUrl) {
                console.error(`Generated signed URL data is unexpectedly null for ${filePath}`);
                throw new Error(`Generated signed URL data is unexpectedly null for ${filePath}`);
            }

            return { filePath, signedUrl: data.signedUrl };
        });

        try {
            const settledResults = await Promise.all(promises);

            // Process successful results and update cache
            // Optional: Wrap cache updates and DB persistence in a transaction
            // await this.databaseService.runTransaction(async (txClient) => {
                for (const result of settledResults) {
                    results[result.filePath] = result.signedUrl;
                    this.cache.set(result.filePath, result.signedUrl);
                    // Optional: Persist cache entry to DB via repository
                    // await this.storageCacheRepository?.upsert(
                    //    { filePath: result.filePath, signedUrl: result.signedUrl, expiresAt: new Date(Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000) },
                    //    txClient // Pass transaction client if repository supports it
                    // );
                }
            // });

        } catch (batchError) {
            // If any promise in Promise.all rejected, catch the error here
            console.error(ERROR_GENERATING_BATCH_SIGNED_URLS, batchError);
            // Re-throw the original error to propagate it
            throw batchError;
        }
    }

    return results;
  }
}

// Optional: Singleton instance if dependency injection isn't fully set up elsewhere
// import { databaseService } from './DatabaseService'; // Assuming singleton export
// export const storageService = new StorageService(databaseService); 