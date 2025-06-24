#!/usr/bin/env python
"""
Test script to verify if your Google Maps API key is working properly
with the populartimes library.
"""

import os
import sys
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

try:
    import populartimes
except ImportError:
    logger.error("populartimes library not found. Please install it with:")
    logger.error("pip install --upgrade git+https://github.com/m-wrzr/populartimes")
    sys.exit(1)

def test_api_key():
    """Test if the Google Maps API key works with populartimes."""
    
    # Get API key from environment variable
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    
    if not api_key:
        logger.error("GOOGLE_MAPS_API_KEY environment variable not set")
        logger.error("Please set your Google Maps API key as an environment variable")
        logger.error("Example: set GOOGLE_MAPS_API_KEY=your_api_key")
        sys.exit(1)
    
    logger.info("Testing API key...")
    
    # Load test locations from the CSV file
    test_locations = []
    csv_file = "cafe_place_ids.csv"
    
    try:
        import csv
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('place_id'):
                    test_locations.append({
                        "id": row['place_id'],
                        "name": row['name']
                    })
        
        if not test_locations:
            logger.warning(f"No valid place IDs found in {csv_file}. Using default test locations.")
            # Fallback to default test locations
            test_locations = [
                {"id": "ChIJJe5a5i98hYARKF0NeaK-9kM", "name": "Caffe Strada"},
                {"id": "ChIJS4sDZp5-hYARIW-0A3ZOoqM", "name": "Blue Bottle Coffee"},
                {"id": "ChIJ0acevi58hYARWbsFtrpCPHI", "name": "Romeo's Coffee"},
                {"id": "ChIJW2yuxCh8hYARGGQHIaJzsZc", "name": "1951 Coffee Company"}
            ]
    except Exception as e:
        logger.error(f"Error loading cafe_place_ids.csv: {str(e)}")
        logger.warning("Using default test locations instead.")
        # Fallback to default test locations
        test_locations = [
            {"id": "ChIJJe5a5i98hYARKF0NeaK-9kM", "name": "Caffe Strada"},
            {"id": "ChIJS4sDZp5-hYARIW-0A3ZOoqM", "name": "Blue Bottle Coffee"},
            {"id": "ChIJ0acevi58hYARWbsFtrpCPHI", "name": "Romeo's Coffee"},
            {"id": "ChIJW2yuxCh8hYARGGQHIaJzsZc", "name": "1951 Coffee Company"}
        ]
    
    logger.info(f"Loaded {len(test_locations)} test locations from {csv_file}")
    # Limit to first 5 locations to avoid excessive API calls
    if len(test_locations) > 5:
        logger.info(f"Limiting to first 5 locations for testing")
        test_locations = test_locations[:5]
    
    # Try each location until one works
    for location in test_locations:
        test_place_id = location["id"]
        logger.info(f"Testing with {location['name']} (ID: {test_place_id})...")
        
        try:
            # Try to fetch details for a known place
            result = populartimes.get_id(api_key, test_place_id)
            
            logger.info("API key is working! Successfully retrieved data:")
            logger.info(f"Place Name: {result.get('name', 'Unknown')}")
            logger.info(f"Address: {result.get('address', 'Unknown')}")
            
            # Check if popular times data is available
            if 'populartimes' in result:
                logger.info("Popular times data is available for this location")
                
                # Show a sample of the data
                sample_day = result['populartimes'][0]
                logger.info(f"Sample data for {sample_day.get('name', 'Unknown')}: "
                           f"Peak hour at {sample_day['data'].index(max(sample_day['data']))}:00 "
                           f"with {max(sample_day['data'])}% busy")
            else:
                logger.warning("No popular times data available for this location")
            
            # If we got here, the test was successful
            return True
            
        except Exception as e:
            logger.error(f"API key test failed with {location['name']}: {str(e)}")
            # Continue to the next location if this one failed
            continue
    
    # If we get here, all locations failed
    logger.error("All test locations failed. Your API key might be invalid or doesn't have the necessary permissions")
    logger.error("Make sure you've enabled the following APIs in your Google Cloud Console:")
    logger.error("  - Places API")
    logger.error("  - Maps JavaScript API")
    logger.error("  - Geocoding API")
    
    # Also check if the API key might have restrictions
    logger.error("\nAdditional troubleshooting:")
    logger.error("1. Check if your API key has any restrictions (IP, referrer, etc.)")
    logger.error("2. Verify that billing is enabled for your Google Cloud project")
    logger.error("3. The populartimes library is unofficial and may break if Google changes their API")
    logger.error("4. Try creating a new API key with no restrictions for testing")
    
    return False

if __name__ == "__main__":
    test_api_key()
