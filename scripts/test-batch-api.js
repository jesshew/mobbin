#!/usr/bin/env node

/**
 * Test script for batch processing API
 * 
 * This script tests the batch processing API endpoints by making requests to them
 * and checking the responses. It's intended to verify that the API endpoints are
 * working as expected before deploying to production.
 * 
 * Usage:
 *   node scripts/test-batch-api.js <batchId>
 */

const fetch = require('node-fetch');

// Configuration
const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const batchId = process.argv[2] || 1; // Default to batch ID 1 if not provided

// Helper function for making API requests
async function makeRequest(endpoint, body = {}) {
  const url = `${baseUrl}${endpoint}`;
  console.log(`Making request to ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    
    console.log(`Response from ${endpoint}:`);
    console.log(`  Status: ${response.status}`);
    console.log(`  Data: ${JSON.stringify(data)}`);
    
    return { success: response.ok, data };
  } catch (error) {
    console.error(`Error calling ${endpoint}:`, error);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runTests() {
  console.log(`Testing batch processing API with batch ID: ${batchId}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log('-----------------------------------');
  
  // Test the process-batch endpoint
  console.log('\n1. Testing process-batch endpoint');
  const initResult = await makeRequest('/api/process-batch', { batchId });
  
  if (!initResult.success) {
    console.error('Error initializing batch processing. Exiting tests.');
    return;
  }
  
  // Wait for a moment to let the process initialize
  console.log('\nWaiting 3 seconds for initialization...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test each individual stage endpoint directly
  console.log('\n2. Testing individual stage endpoints');
  
  const stages = [
    '/api/batch-processing/setup',
    '/api/batch-processing/extraction',
    '/api/batch-processing/annotation',
    '/api/batch-processing/validation',
    '/api/batch-processing/metadata',
    '/api/batch-processing/persistence'
  ];
  
  for (const stage of stages) {
    console.log(`\nTesting ${stage}`);
    const result = await makeRequest(stage, { batchId });
    
    if (!result.success) {
      console.error(`Error testing ${stage}. Continuing with next stage.`);
    }
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\nAll tests completed.');
}

// Run the tests
runTests().catch(error => {
  console.error('Test script failed:', error);
  process.exit(1);
}); 