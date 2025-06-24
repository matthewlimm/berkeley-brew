/**
 * Simple scheduler for popular times data updates
 * This script will run the fetch_popular_times.py script once a week
 * You can run this with Node.js in the background or set up a proper cron job
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const PYTHON_PATH = 'python'; // Change this if you need to use a specific Python path
const SCRIPT_PATH = path.join(__dirname, 'fetch_popular_times.py');
const LOG_PATH = path.join(__dirname, 'popular_times_updates.log');
const UPDATE_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Ensure the script exists
if (!fs.existsSync(SCRIPT_PATH)) {
  console.error(`Error: Script not found at ${SCRIPT_PATH}`);
  process.exit(1);
}

/**
 * Run the popular times update script
 */
function updatePopularTimes() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Running popular times update...`);
  
  // Log the start of the update
  fs.appendFileSync(LOG_PATH, `\n[${timestamp}] Starting popular times update\n`);
  
  // Execute the Python script
  const process = exec(`${PYTHON_PATH} "${SCRIPT_PATH}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing script: ${error.message}`);
      fs.appendFileSync(LOG_PATH, `[${timestamp}] Error: ${error.message}\n`);
      return;
    }
    
    if (stderr) {
      console.error(`Script stderr: ${stderr}`);
      fs.appendFileSync(LOG_PATH, `[${timestamp}] stderr: ${stderr}\n`);
    }
    
    console.log(`[${timestamp}] Popular times update completed successfully`);
    fs.appendFileSync(LOG_PATH, `[${timestamp}] Update completed successfully\n`);
    fs.appendFileSync(LOG_PATH, `[${timestamp}] stdout: ${stdout}\n`);
  });
  
  // Schedule the next update
  setTimeout(updatePopularTimes, UPDATE_INTERVAL);
}

// Start the scheduler
console.log('Starting popular times update scheduler');
console.log(`Updates will run every ${UPDATE_INTERVAL / (24 * 60 * 60 * 1000)} days`);
console.log(`Logs will be written to ${LOG_PATH}`);

// Run the first update immediately
updatePopularTimes();
