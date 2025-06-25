#!/bin/bash

# Shell script to run the comprehensive cafe data update script
# This script loads environment variables from .env and runs the Node.js script

# Change to the project root directory
cd "$(dirname "$0")/../../../" || exit

# Check if .env file exists
if [ ! -f .env ]; then
  echo "Error: .env file not found in project root"
  echo "Please create a .env file with the required environment variables:"
  echo "- SUPABASE_URL"
  echo "- SUPABASE_SERVICE_ROLE_KEY"
  echo "- GOOGLE_MAPS_API_KEY"
  exit 1
fi

# Load environment variables from .env
export $(grep -v '^#' .env | xargs)

# Check for required environment variables
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ] || [ -z "$GOOGLE_MAPS_API_KEY" ]; then
  echo "Error: Missing required environment variables"
  echo "Please ensure your .env file contains:"
  echo "- SUPABASE_URL"
  echo "- SUPABASE_SERVICE_ROLE_KEY"
  echo "- GOOGLE_MAPS_API_KEY"
  exit 1
fi

# Run the Node.js script
echo "Running comprehensive cafe data update script..."
node packages/api/scripts/update_cafe_data.js

# Check exit status
if [ $? -eq 0 ]; then
  echo "✅ Cafe data update completed successfully!"
else
  echo "❌ Cafe data update failed!"
  exit 1
fi
