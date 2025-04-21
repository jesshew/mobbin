import dotenv from 'dotenv';

dotenv.config(); // Load .env file if present

interface AppConfiguration {
  supabaseUrl: string | undefined;
  supabaseAnonKey: string | undefined;
  supabaseBucketName: string | undefined;
  imageTargetWidth: number;
  imageTargetHeight: number;
  imageJpegQuality: number;
  // Add other config variables as needed
}

export const AppConfig: AppConfiguration = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseBucketName: process.env.SUPABASE_BUCKET_NAME || 'screenshots', // Default bucket name
  imageTargetWidth: parseInt(process.env.IMAGE_TARGET_WIDTH || '800', 10),
  imageTargetHeight: parseInt(process.env.IMAGE_TARGET_HEIGHT || '800', 10),
  imageJpegQuality: parseInt(process.env.IMAGE_JPEG_QUALITY || '80', 10),
};

// Simple validation (optional but recommended)
if (!AppConfig.supabaseUrl || !AppConfig.supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing in environment variables.');
    // Depending on strictness, you might throw an error here
    // throw new Error('Supabase URL and Anon Key must be configured.');
}

if (isNaN(AppConfig.imageTargetWidth) || isNaN(AppConfig.imageTargetHeight) || isNaN(AppConfig.imageJpegQuality)) {
    console.warn('Image dimensions or quality environment variables are not valid numbers. Using defaults.');
    // Reset to defaults if parsing failed
    AppConfig.imageTargetWidth = 800;
    AppConfig.imageTargetHeight = 800;
    AppConfig.imageJpegQuality = 80;
} 