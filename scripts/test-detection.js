// Test script for MoondreamDetectionService
import { processImageFile } from '../lib/services/MoondreamDetectionService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test labels dictionary
const testLabels = {
  "Header Section > Title": "Small black text 'Tesla Inc.' centered at the top of the screen, providing company context above the current stock price",
  
  "Header Section > Info Icon": "Circular black-bordered icon with an 'i' inside, placed to the right of 'Tesla Inc.', indicating access to company details or help",

  "Stock Price Section > Current Price": "Large black bold text '$221.33' denoting the current trading price, visually prominent near the top of the screen below the title"
};

// Main execution
async function main() {
  console.log('Starting detection test...');
  
  // Process image with test labels
  // Note: Update the path to your test image
  const imagePath = 'path/to/your/test/image.png';
  
  const result = await processImageFile(imagePath, testLabels);
  
  if (result) {
    console.log('Detection test completed successfully');
    console.log('Output directory:', result.outputDir);
    console.log('Categories detected:', Object.keys(result.categories).length);
    
    // Log details about each category
    for (const [category, items] of Object.entries(result.categories)) {
      console.log(`Category '${category}' contains ${items.length} detected items`);
    }
  } else {
    console.error('Detection test failed');
  }
}

main().catch(console.error); 