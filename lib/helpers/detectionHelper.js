import { processAndSaveByCategory, processImageFile } from '../services/MoondreamDetectionService';
import fs from 'fs';
import path from 'path';

/**
 * Processes a screenshot buffer with provided labels
 * @param {Buffer} screenshotBuffer - The screenshot buffer to process
 * @param {Object} labelsDictionary - Dictionary of labels to descriptions
 * @returns {Promise<Object>} Processing result with categories and output directory
 */
export async function processScreenshotWithLabels(screenshotBuffer, labelsDictionary) {
  if (!screenshotBuffer) {
    throw new Error('Screenshot buffer is required');
  }
  
  if (!labelsDictionary || Object.keys(labelsDictionary).length === 0) {
    throw new Error('Labels dictionary is required and cannot be empty');
  }
  
  return processAndSaveByCategory(screenshotBuffer, labelsDictionary);
}

/**
 * Processes a screenshot file with provided labels
 * @param {string} screenshotPath - Path to the screenshot file
 * @param {Object} labelsDictionary - Dictionary of labels to descriptions
 * @returns {Promise<Object>} Processing result with categories and output directory
 */
export async function processScreenshotFileWithLabels(screenshotPath, labelsDictionary) {
  if (!screenshotPath) {
    throw new Error('Screenshot path is required');
  }
  
  if (!labelsDictionary || Object.keys(labelsDictionary).length === 0) {
    throw new Error('Labels dictionary is required and cannot be empty');
  }
  
  return processImageFile(screenshotPath, labelsDictionary);
}

/**
 * Loads a labels dictionary from a JSON file
 * @param {string} jsonPath - Path to the JSON file containing labels
 * @returns {Promise<Object>} Labels dictionary
 */
export async function loadLabelsFromJson(jsonPath) {
  try {
    const fileData = await fs.promises.readFile(jsonPath, 'utf8');
    return JSON.parse(fileData);
  } catch (err) {
    console.error(`Error loading labels from JSON file: ${err}`);
    throw err;
  }
}

/**
 * Saves labels dictionary to a JSON file
 * @param {Object} labelsDictionary - The labels dictionary to save
 * @param {string} outputPath - Path to save the JSON file
 * @returns {Promise<string>} Path to the saved file
 */
export async function saveLabelsToJson(labelsDictionary, outputPath) {
  try {
    const dirPath = path.dirname(outputPath);
    await fs.promises.mkdir(dirPath, { recursive: true });
    
    await fs.promises.writeFile(
      outputPath, 
      JSON.stringify(labelsDictionary, null, 2),
      'utf8'
    );
    
    return outputPath;
  } catch (err) {
    console.error(`Error saving labels to JSON file: ${err}`);
    throw err;
  }
} 