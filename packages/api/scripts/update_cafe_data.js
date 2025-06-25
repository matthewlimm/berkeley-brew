#!/usr/bin/env node

/**
 * Comprehensive Cafe Data Update Script
 * 
 * This script updates all cafe data in one go:
 * 1. Place IDs from Google Places API
 * 2. Business hours from Google Places API
 * 3. Popular times data (calls Python script)
 * 
 * Requires:
 * - Node.js 18+ (for global fetch)
 * - Python 3.6+ with populartimes library
 * - Environment variables in .env file
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to load environment variables from .env file
function loadEnv() {
  try {
    const envPath = path.resolve(__dirname, '../../../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Parse .env file and set environment variables
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        
        process.env[key] = value;
      }
    });
    
    console.log('Environment variables loaded successfully');
  } catch (error) {
    console.warn('Error loading .env file:', error.message);
  }
}

// Load environment variables
loadEnv();

// Check for required environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GOOGLE_MAPS_API_KEY) {
  console.error('Missing required environment variables. Please check your .env file.');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_MAPS_API_KEY');
  process.exit(1);
}

// Helper function for making Supabase REST API calls
async function supabaseRequest(endpoint, options = {}) {
  // Ensure the URL has the correct format
  let baseUrl = SUPABASE_URL;
  if (!baseUrl.endsWith('/')) {
    baseUrl = baseUrl + '/';
  }
  
  // Remove any leading slash from the endpoint
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  const url = `${baseUrl}${cleanEndpoint}`;
  console.log(`Making request to: ${url}`);
  
  const headers = {
    'apikey': SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': options.prefer || 'return=representation'
  };
  
  const method = options.method || 'GET';
  
  const requestOptions = {
    method,
    headers
  };
  
  if (options.body) {
    requestOptions.body = JSON.stringify(options.body);
  }
  
  try {
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }
    
    // For HEAD requests or when no content is expected
    if (method === 'HEAD' || response.status === 204) {
      return { status: response.status, ok: response.ok };
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error in Supabase request to ${url}:`, error.message);
    throw error;
  }
}

// Function to find place ID for a cafe
async function findPlaceId(name, address) {
  try {
    const query = `${name}, ${address}`;
    const url = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
    url.searchParams.append('input', query);
    url.searchParams.append('inputtype', 'textquery');
    url.searchParams.append('fields', 'place_id,name,formatted_address');
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
      console.log(`Found place ID for ${name}: ${data.candidates[0].place_id}`);
      return data.candidates[0].place_id;
    } else {
      console.warn(`No place found for: ${name}, ${address}`);
      return null;
    }
  } catch (error) {
    console.error(`Error finding place ID for ${name}, ${address}:`, error.message);
    return null;
  }
}

// Function to get place details including opening hours
async function getPlaceDetails(placeId) {
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.append('place_id', placeId);
    url.searchParams.append('fields', 'name,opening_hours');
    url.searchParams.append('key', GOOGLE_MAPS_API_KEY);
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      console.log(`Retrieved opening hours for place ID: ${placeId}`);
      return data.result.opening_hours || null;
    } else {
      console.warn(`No details found for place ID: ${placeId}`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting place details for ${placeId}:`, error.message);
    return null;
  }
}

// Function to get all cafes from Supabase
async function getCafes() {
  try {
    console.log('Fetching cafes from database...');
    const cafes = await supabaseRequest('rest/v1/cafes?select=id,name,address,latitude,longitude');
    console.log(`Found ${cafes.length} cafes in database`);
    return cafes;
  } catch (error) {
    console.error('Error fetching cafes:', error.message);
    return [];
  }
}

// Function to update a cafe with place ID and business hours
async function updateCafe(id, placeId, businessHours) {
  try {
    console.log(`Updating cafe ID: ${id}`);
    console.log(`Place ID: ${placeId}`);
    console.log(`Has business hours: ${businessHours ? 'Yes' : 'No'}`);
    
    const updateData = { place_id: placeId };
    if (businessHours) {
      updateData.business_hours = businessHours;
    }
    
    console.log(`Update data: ${JSON.stringify(updateData).substring(0, 100)}...`);
    
    const url = `${SUPABASE_URL}/rest/v1/cafes?id=eq.${id}`;
    console.log(`Making direct PATCH request to: ${url}`);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }
    
    console.log(`Successfully updated cafe ID ${id} with place ID ${placeId}`);
    return true;
  } catch (error) {
    console.error(`Error updating cafe ID ${id}:`, error.message);
    return false;
  }
}

// Function to save place IDs to CSV for Python script
function savePlaceIdsToCSV(cafes) {
  try {
    const csvPath = path.resolve(__dirname, 'cafe_place_ids.csv');
    const header = 'name,place_id,google_name,google_address\n';
    let csvContent = header;
    
    for (const cafe of cafes) {
      if (cafe.place_id) {
        // Escape commas and quotes in fields
        const name = cafe.name.replace(/"/g, '""');
        const address = cafe.address ? cafe.address.replace(/"/g, '""') : '';
        csvContent += `"${name}","${cafe.place_id}","${name}","${address}"\n`;
      }
    }
    
    fs.writeFileSync(csvPath, csvContent);
    console.log(`Saved ${cafes.filter(c => c.place_id).length} place IDs to ${csvPath}`);
    return csvPath;
  } catch (error) {
    console.error('Error saving place IDs to CSV:', error.message);
    return null;
  }
}

// Function to run the Python script for popular times
function updatePopularTimes() {
  try {
    console.log('Running Python script to update popular times...');
    
    // Check if Python is available
    try {
      execSync('python3 --version');
      console.log('Python 3 is available');
    } catch (error) {
      console.warn('Python 3 not found, trying python...');
      execSync('python --version');
    }
    
    // Check if populartimes library is installed
    try {
      execSync('pip3 show populartimes || pip show populartimes');
      console.log('populartimes library is installed');
    } catch (error) {
      console.error('populartimes library is not installed. Please install it using:');
      console.error('pip install --user git+https://github.com/m-wrzr/populartimes');
      return false;
    }
    
    // Run the Python script
    const pythonScript = path.resolve(__dirname, 'fetch_popular_times.py');
    if (!fs.existsSync(pythonScript)) {
      console.error(`Python script not found: ${pythonScript}`);
      return false;
    }
    
    console.log(`Running: python3 ${pythonScript}`);
    const output = execSync(`python3 ${pythonScript} || python ${pythonScript}`, { 
      env: process.env,
      encoding: 'utf8'
    });
    
    console.log('Python script output:');
    console.log(output);
    
    return true;
  } catch (error) {
    console.error('Error running Python script for popular times:', error.message);
    return false;
  }
}

// Main function to update all cafes
async function updateAllCafes() {
  try {
    console.log('Starting cafe data update process...');
    
    // Get all cafes
    const cafes = await getCafes();
    if (!cafes.length) {
      console.error('No cafes found in database. Exiting.');
      return;
    }
    
    console.log(`Processing ${cafes.length} cafes for place IDs and business hours`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Process each cafe
    for (const cafe of cafes) {
      console.log(`\nProcessing cafe: ${cafe.name}`);
      
      // Find place ID
      const placeId = await findPlaceId(cafe.name, cafe.address);
      
      if (placeId) {
        // Get place details
        const openingHours = await getPlaceDetails(placeId);
        
        // Update cafe in database
        const success = await updateCafe(cafe.id, placeId, openingHours);
        
        // Add place_id to cafe object for CSV export
        cafe.place_id = placeId;
        
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      } else {
        console.log(`No place ID found for ${cafe.name}`);
        failCount++;
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('\n--- Update Summary ---');
    console.log(`Total cafes processed: ${cafes.length}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed to update: ${failCount}`);
    
    // Save place IDs to CSV for Python script
    const csvPath = savePlaceIdsToCSV(cafes);
    if (!csvPath) {
      console.error('Failed to save place IDs to CSV. Skipping popular times update.');
      return;
    }
    
    // Run Python script to update popular times
    console.log('\nUpdating popular times data...');
    const popularTimesSuccess = updatePopularTimes();
    
    if (popularTimesSuccess) {
      console.log('Popular times data updated successfully');
    } else {
      console.error('Failed to update popular times data');
    }
    
    console.log('Cafe data update process completed');
  } catch (error) {
    console.error('Error in update process:', error.message);
  }
}

// Run the update process
updateAllCafes().then(() => {
  console.log('Script execution completed');
}).catch(error => {
  console.error('Script execution failed:', error.message);
  process.exit(1);
});
