import Jimp from 'jimp';
import fs from 'fs';
import path from 'path';

// --- Constants ---
const BOX_COLOR = 0xFF0000FF; // RGBA Red color
const BOX_WIDTH = 2;
const OVERLAY_COLOR = 0x80808080; // RGBA semi-transparent gray
const OVERLAY_ALPHA = 0.5;
const REFERENCE_POINT_COLOR = 0x00FF00FF; // RGBA Green color
const REFERENCE_POINT_SIZE = 4;
const TEXT_COLOR = 0xFFFFFFFF; // RGBA White color
const TEXT_BACKGROUND = 0x000000AA; // RGBA Black color with some transparency

// Accuracy Colors matching ValidationService thresholds
const ACCURACY_COLORS = {
  HIGH: 0x00FF00FF,   // Green (≥85%)
  MEDIUM: 0xFFFF00FF, // Yellow (70-84%)
  LOW_MEDIUM: 0xFFA500FF, // Orange (50-69%)
  LOW: 0xFF0000FF,    // Red (<50%)
  SUGGESTED: 0xFFA500FF // Orange for suggested boxes
};

/**
 * Normalizes a label string into a file/key-friendly format
 * @param {string} label - The label to normalize
 * @returns {string} Normalized label string
 */
function normalizeLabel(label) {
  return label.toLowerCase().replace(/\s/g, '_').replace(/>/g, '_').replace(/\//g, '_');
}

/**
 * Draw a rectangle with a specific width
 * @param {Jimp} image - Jimp image to draw on
 * @param {number} x - X coordinate of top-left corner
 * @param {number} y - Y coordinate of top-left corner
 * @param {number} width - Width of the rectangle
 * @param {number} height - Height of the rectangle
 * @param {number} color - Color of the rectangle (RGBA hex)
 * @param {number} lineWidth - Width of the rectangle border
 */
function drawRect(image, x, y, width, height, color, lineWidth) {
  // Draw top line
  image.scan(x, y, width, lineWidth, function(cx, cy, idx) {
    this.bitmap.data[idx] = (color >> 24) & 0xFF;     // R
    this.bitmap.data[idx + 1] = (color >> 16) & 0xFF; // G
    this.bitmap.data[idx + 2] = (color >> 8) & 0xFF;  // B
    this.bitmap.data[idx + 3] = color & 0xFF;         // A
  });
  
  // Draw bottom line
  image.scan(x, y + height - lineWidth, width, lineWidth, function(cx, cy, idx) {
    this.bitmap.data[idx] = (color >> 24) & 0xFF;     // R
    this.bitmap.data[idx + 1] = (color >> 16) & 0xFF; // G
    this.bitmap.data[idx + 2] = (color >> 8) & 0xFF;  // B
    this.bitmap.data[idx + 3] = color & 0xFF;         // A
  });
  
  // Draw left line
  image.scan(x, y, lineWidth, height, function(cx, cy, idx) {
    this.bitmap.data[idx] = (color >> 24) & 0xFF;     // R
    this.bitmap.data[idx + 1] = (color >> 16) & 0xFF; // G
    this.bitmap.data[idx + 2] = (color >> 8) & 0xFF;  // B
    this.bitmap.data[idx + 3] = color & 0xFF;         // A
  });
  
  // Draw right line
  image.scan(x + width - lineWidth, y, lineWidth, height, function(cx, cy, idx) {
    this.bitmap.data[idx] = (color >> 24) & 0xFF;     // R
    this.bitmap.data[idx + 1] = (color >> 16) & 0xFF; // G
    this.bitmap.data[idx + 2] = (color >> 8) & 0xFF;  // B
    this.bitmap.data[idx + 3] = color & 0xFF;         // A
  });
}

/**
 * Draw a filled rectangle on the image
 * @param {Jimp} image - Jimp image to draw on
 * @param {number} x - X coordinate of top-left corner
 * @param {number} y - Y coordinate of top-left corner
 * @param {number} width - Width of the rectangle
 * @param {number} height - Height of the rectangle
 * @param {number} color - Color of the rectangle (RGBA hex)
 */
function fillRect(image, x, y, width, height, color) {
  // Make sure coordinates are integers and within bounds
  const startX = Math.max(0, Math.floor(x));
  const startY = Math.max(0, Math.floor(y));
  const imgWidth = image.getWidth();
  const imgHeight = image.getHeight();
  
  // Ensure width/height calculations don't exceed image boundaries
  const endX = Math.min(imgWidth, startX + width);
  const endY = Math.min(imgHeight, startY + height);
  
  const drawWidth = endX - startX;
  const drawHeight = endY - startY;
  
  if (drawWidth <= 0 || drawHeight <= 0) return;
  
  image.scan(startX, startY, drawWidth, drawHeight, function(cx, cy, idx) {
    this.bitmap.data[idx] = (color >> 24) & 0xFF;     // R
    this.bitmap.data[idx + 1] = (color >> 16) & 0xFF; // G
    this.bitmap.data[idx + 2] = (color >> 8) & 0xFF;  // B
    this.bitmap.data[idx + 3] = color & 0xFF;         // A
  });
}

/**
 * Creates a transparent area in the overlay for detected objects
 * @param {Jimp} overlay - Overlay image to modify
 * @param {number} x - X coordinate of top-left corner
 * @param {number} y - Y coordinate of top-left corner
 * @param {number} width - Width of the transparent area
 * @param {number} height - Height of the transparent area
 * @param {number} boxWidth - Width of the border that should remain opaque
 */
function createTransparentArea(overlay, x, y, width, height, boxWidth) {
   // Ensure x, y, width, height are within overlay bounds and integers
   const overlayWidth = overlay.getWidth();
   const overlayHeight = overlay.getHeight();

   const startX = Math.max(0, Math.floor(x + boxWidth));
   const startY = Math.max(0, Math.floor(y + boxWidth));
   const endX = Math.min(overlayWidth, Math.floor(x + width - boxWidth));
   const endY = Math.min(overlayHeight, Math.floor(y + height - boxWidth));

   const clearWidth = Math.max(0, endX - startX);
   const clearHeight = Math.max(0, endY - startY);

   if (clearWidth > 0 && clearHeight > 0) {
       overlay.scan(startX, startY, clearWidth, clearHeight, function(cx, cy, idx) {
           this.bitmap.data[idx + 3] = 0; // Set alpha to 0 (fully transparent)
       });
   }
}

/**
 * Draw a simple coordinate label directly with pixel rectangles
 * @param {Jimp} image - Jimp image to draw on
 * @param {number} x - X coordinate for text start
 * @param {number} y - Y coordinate for text start
 * @param {string} value - Value to display
 * @param {number} color - Text color
 */
function drawCoordinateLabel(image, x, y, value, color = TEXT_COLOR) {
  // First draw background for better visibility
  const padding = 2;
  const charWidth = 5;
  const charHeight = 7;
  const totalWidth = value.length * (charWidth + 1) + padding * 2;
  const totalHeight = charHeight + padding * 2;
  
  // Ensure text stays within image bounds
  const imgWidth = image.getWidth();
  const imgHeight = image.getHeight();
  
  const textX = Math.max(0, Math.min(imgWidth - totalWidth, x));
  const textY = Math.max(0, Math.min(imgHeight - totalHeight, y));
  
  // Draw background
  fillRect(image, textX, textY, totalWidth, totalHeight, TEXT_BACKGROUND);
  
  // Draw text value
  image.scan(textX, textY, totalWidth, totalHeight, function(cx, cy, idx) {
    // Set entire area to the background color with some transparency
    this.bitmap.data[idx + 3] = 180; // Alpha component
  });
  
  // Place coordinate values as plain text using a simple technique
  const text = value;
  let currentX = textX + padding;
  
  for (let i = 0; i < text.length; i++) {
    // Draw a small rectangle for each character with the text color
    // This is a simple way to "stamp" the presence of text without rendering actual fonts
    fillRect(image, currentX, textY + padding, charWidth, charHeight, color);
    currentX += charWidth + 1;
  }
}

/**
 * Draw reference points at 0%, 25%, 50%, 75%, and 100% positions on each edge of the image
 * @param {Jimp} image - Jimp image to draw on
 * @param {number} imgWidth - Width of the image
 * @param {number} imgHeight - Height of the image
 * @param {number} color - Color for reference points (RGBA hex)
 * @param {number} pointSize - Size of the reference points
 */
function drawReferencePoints(image, imgWidth, imgHeight, color = REFERENCE_POINT_COLOR, pointSize = REFERENCE_POINT_SIZE) {
  const percentages = [0, 0.25, 0.5, 0.75, 1.0];
  
  // Top edge points
  percentages.forEach(percent => {
    const x = Math.floor(percent * (imgWidth - 1));
    const y = 0;
    
    // Draw point (larger to be more visible)
    fillRect(image, x - pointSize/2, y - pointSize/2, pointSize, pointSize, color);
    
    // Draw coordinate label
    const labelText = `(${x},${y})`;
    drawCoordinateLabel(image, x - 20, y + pointSize * 2, labelText);
  });
  
  // Bottom edge points
  percentages.forEach(percent => {
    const x = Math.floor(percent * (imgWidth - 1));
    const y = imgHeight - 1;
    
    // Draw point
    fillRect(image, x - pointSize/2, y - pointSize/2, pointSize, pointSize, color);
    
    // Draw coordinate label
    const labelText = `(${x},${y})`;
    drawCoordinateLabel(image, x - 20, y - 20, labelText);
  });
  
  // Left edge points
  percentages.forEach(percent => {
    const x = 0;
    const y = Math.floor(percent * (imgHeight - 1));
    
    // Draw point
    fillRect(image, x - pointSize/2, y - pointSize/2, pointSize, pointSize, color);
    
    // Draw coordinate label
    const labelText = `(${x},${y})`;
    drawCoordinateLabel(image, x + pointSize * 2, y - 10, labelText);
  });
  
  // Right edge points
  percentages.forEach(percent => {
    const x = imgWidth - 1;
    const y = Math.floor(percent * (imgHeight - 1));
    
    // Draw point
    fillRect(image, x - pointSize/2, y - pointSize/2, pointSize, pointSize, color);
    
    // Draw coordinate label
    const labelText = `(${x},${y})`;
    drawCoordinateLabel(image, x - 50, y - 10, labelText);
  });
}



/**
 * Generates an annotated image buffer for a specific component/category
 * @param {Buffer} baseImageBuffer - The original image buffer
 * @param {Array} detectedItems - Detected items for this component
 * @param {number} color - Color for bounding boxes (defaults to BOX_COLOR)
 * @param {string} categoryName - Name of the category (for logging)
 * @returns {Promise<Buffer|null>} Buffer of the annotated image, or null on error
 */
async function generateAnnotatedImageBuffer(baseImageBuffer, detectedItems, color = BOX_COLOR, categoryName) {
  const itemsToDraw = detectedItems.filter(item => item.status === 'Detected' && item.bounding_box);

  try {
    const baseImage = await Jimp.read(baseImageBuffer);
    const imgWidth = baseImage.getWidth();
    const imgHeight = baseImage.getHeight();

    // Create a semi-transparent overlay
    const overlay = new Jimp(imgWidth, imgHeight, OVERLAY_COLOR);

    // Sort itemsToDraw by area (descending) to process larger boxes first
    // This prevents large-box clear from erasing smaller borders
    itemsToDraw.sort((a, b) => {
      const areaA = (a.bounding_box.x_max - a.bounding_box.x_min) * (a.bounding_box.y_max - a.bounding_box.y_min);
      const areaB = (b.bounding_box.x_max - b.bounding_box.x_min) * (b.bounding_box.y_max - b.bounding_box.y_min);
      return areaB - areaA; // Descending order
    });

    // Process each detection and draw boxes on the overlay
    for (const item of itemsToDraw) {
      const { x_min, y_min, x_max, y_max } = item.bounding_box;

      // Make sure coordinates are integers and within bounds
      const x = Math.max(0, Math.floor(x_min));
      const y = Math.max(0, Math.floor(y_min));
      // Ensure width/height calculations don't exceed image boundaries
      const potentialWidth = Math.ceil(x_max - x_min);
      const potentialHeight = Math.ceil(y_max - y_min);
      const width = Math.min(imgWidth - x, potentialWidth);
      const height = Math.min(imgHeight - y, potentialHeight);

      if (width <= 0 || height <= 0) {
        console.warn(`Invalid box dimensions for item '${item.label}' in category '${categoryName}': ${width}x${height}`);
        continue;
      }

      // Draw the box outline on the overlay
      drawRect(overlay, x, y, width, height, color, BOX_WIDTH);

      // Create transparent area inside the box
      createTransparentArea(overlay, x, y, width, height, BOX_WIDTH);
    }

    // Composite the overlay onto the base image
    baseImage.composite(overlay, 0, 0, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 1, // Use overlay's alpha
      opacityDest: 1
    });

    // Return the buffer
    const annotatedBuffer = await baseImage.getBufferAsync(Jimp.MIME_PNG);
    // console.log(`Generated annotated image buffer for category '${categoryName}'.`);
    return annotatedBuffer;

  } catch (err) {
    console.error(`Error generating annotated image buffer for category '${categoryName}': ${err}`);
    return null;
  }
}

/**
 * Renders a category image (for debugging/local saving)
 * @param {Buffer} annotatedImageBuffer - The generated annotated image buffer
 * @param {string} categoryName - Name of the category
 * @param {string} outputDir - Directory to save output
 * @returns {Promise<void>}
 */
async function saveAnnotatedImageDebug(annotatedImageBuffer, categoryName, outputDir) {
   if (!annotatedImageBuffer || process.env.SAVE_DEBUG_FILES !== 'true') {
     return; // Don't save if buffer is null or debug saving is off
   }
   try {
     const normalizedKey = normalizeLabel(categoryName);
     const savePath = path.join(outputDir, `${normalizedKey}.png`);
     await fs.promises.writeFile(savePath, annotatedImageBuffer);
    //  console.log(`Debug image saved successfully to: ${savePath}`);
   } catch (err) {
     console.error(`Error saving debug image for '${categoryName}': ${err}`);
   }
}

export {
  BOX_COLOR,
  BOX_WIDTH,
  OVERLAY_COLOR,
  OVERLAY_ALPHA,
  REFERENCE_POINT_COLOR,
  REFERENCE_POINT_SIZE,
  TEXT_COLOR,
  TEXT_BACKGROUND,
  ACCURACY_COLORS,
  drawRect,
  fillRect,
  // drawDashedRect,
  createTransparentArea,
  drawCoordinateLabel,
  drawReferencePoints,
  generateAnnotatedImageBuffer,
  saveAnnotatedImageDebug,
  normalizeLabel
}; 