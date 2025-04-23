#!/usr/bin/env node

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { processScreenshotFileWithLabels, saveLabelsToJson } from '../lib/helpers/detectionHelper';

// Load environment variables
dotenv.config();

// Sample UI element labels with descriptions
const sampleLabels = {
  "Navigation Bar > Logo": "Brand logo typically positioned in the top-left corner of the screen",
  "Navigation Bar > Menu Icon": "Three horizontal lines (hamburger icon) or similar, usually in a corner of the navigation bar",
  "Navigation Bar > Profile Button": "Circle with initials, profile picture, or person icon, typically in the top-right area",
  
  "Content Area > Header": "Large text at the top of the main content area, serves as the page or section title",
  "Content Area > Subheader": "Secondary text below the header, often providing additional context",
  "Content Area > Body Text": "Standard-sized text forming the main content paragraphs",
  
  "Controls > Primary Button": "Most prominent button on the screen, often in brand color with contrasting text",
  "Controls > Secondary Button": "Less visually dominant button, often with outline or lighter styling",
  "Controls > Input Field": "Text entry box, typically rectangular with placeholder text or a label",
  
  "Media > Main Image": "The primary or largest image on the screen",
  "Media > Thumbnail": "Small preview images, often in grids or carousels",
  "Media > Icon": "Small symbolic images used to represent actions or categories",
  
  "Footer > Copyright Text": "Small text at the bottom of the screen mentioning ownership rights",
  "Footer > Links": "Row of text links at the bottom of the screen to other important pages"
};

/**
 * Main function to run the detection process
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
      console.error('Usage: node detect-ui-elements.js <screenshot_path> [output_directory]');
      process.exit(1);
    }
    
    const screenshotPath = args[0];
    // Use provided output directory or create a timestamp-based one
    const outputDir = args[1] || `detection_output_${Date.now()}`;
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    console.log(`Processing image: ${screenshotPath}`);
    console.log(`Output directory: ${outputDir}`);
    
    // Save the labels for reference
    const labelsPath = path.join(outputDir, 'labels.json');
    await saveLabelsToJson(sampleLabels, labelsPath);
    console.log(`Labels saved to: ${labelsPath}`);
    
    // Run the detection process
    console.log('Starting detection process...');
    const startTime = Date.now();
    
    const result = await processScreenshotFileWithLabels(screenshotPath, sampleLabels);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    if (result) {
      console.log(`Detection completed in ${duration.toFixed(2)} seconds`);
      console.log(`Output directory: ${result.outputDir}`);
      
      const categoriesDetected = Object.keys(result.categories).length;
      console.log(`Found ${categoriesDetected} categories with UI elements`);
      
      // Print summary of detected elements by category
      for (const [category, items] of Object.entries(result.categories)) {
        console.log(`\n${category}:`);
        for (const item of items) {
          const detectionCount = item.detections?.length || 0;
          console.log(`  - ${item.label}: ${detectionCount} detection(s)`);
        }
      }
      
      // Write a summary report
      const reportPath = path.join(result.outputDir, 'detection_summary.json');
      const summary = {
        processed_at: new Date().toISOString(),
        duration_seconds: duration,
        image_path: screenshotPath,
        categories_count: categoriesDetected,
        detection_stats: Object.entries(result.categories).map(([category, items]) => ({
          category,
          items_count: items.length,
          total_detections: items.reduce((sum, item) => sum + (item.detections?.length || 0), 0)
        }))
      };
      
      fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
      console.log(`\nDetection summary saved to: ${reportPath}`);
    } else {
      console.error('Detection process failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error running detection process:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error); 