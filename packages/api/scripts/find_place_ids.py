#!/usr/bin/env python
"""
Script to find Google Place IDs for a list of cafes using the Google Places API.
This uses the Find Place and Place Details endpoints from the Places API.
"""

import os
import sys
import json
import requests
import logging
import csv
from urllib.parse import quote

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# List of cafes from your database
CAFES = [
    {"name": "Sodoi Coffee Tasting House", "address": "2438 Durant Ave, Berkeley, CA 94704"},
    {"name": "Philz Coffee, College", "address": "6310 College Ave, Oakland, CA 94618"},
    {"name": "Ain't Normal Cafe", "address": "3988 Piedmont Ave, Oakland, CA 94611"},
    {"name": "Timeless Coffee", "address": "2965 College Ave, Berkeley, CA 94705"},
    {"name": "Artis Coffee", "address": "1717 4th St, Berkeley, CA 94710"},
    {"name": "CoRo Coffee Roastery", "address": "2530 Ridge Rd, Berkeley, CA 94709"},
    {"name": "Caffe Strada", "address": "2300 College Ave, Berkeley, CA 94704"},
    {"name": "1951 Coffee Company", "address": "2410 Channing Way, Berkeley, CA 94704"},
    {"name": "Romeo's Coffee", "address": "2499 Telegraph Ave, Berkeley, CA 94704"},
    {"name": "Yali's Cafe", "address": "1920 Oxford St, Berkeley, CA 94704"},
    {"name": "The Hidden Cafe", "address": "1250 Addison St #113, Berkeley, CA 94702"},
    {"name": "Blue Bottle Coffee", "address": "3083 Claremont Ave, Berkeley, CA 94705"},
    {"name": "Victory Point Cafe", "address": "1797 Shattuck Ave, Berkeley, CA 94709"},
    {"name": "Free Speech Movement Cafe", "address": "Moffitt Library, UC Berkeley, Berkeley, CA"},
    {"name": "Souvenir Coffee, Claremont", "address": "3084 Claremont Ave, Berkeley, CA 94705"},
    {"name": "Peet's Coffee, Telegraph", "address": "2501 Telegraph Ave, Berkeley, CA 94704"},
    {"name": "Souvenir Coffee, College", "address": "2701 College Ave, Berkeley, CA 94705"},
    {"name": "Cafenated Coffee, Southside", "address": "2960 College Ave, Berkeley, CA 94705"},
    {"name": "Cafenated Coffee, Northside", "address": "2085 Vine St, Berkeley, CA 94709"}
]

def find_place_id(cafe_name, cafe_address, api_key):
    """Find the Google Place ID for a cafe using the Find Place API."""
    
    # First, try to find the place using both name and address
    input_text = f"{cafe_name} {cafe_address}"
    encoded_input = quote(input_text)
    
    url = f"https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input={encoded_input}&inputtype=textquery&fields=place_id,name,formatted_address&key={api_key}"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if data.get("status") == "OK" and data.get("candidates"):
            place_id = data["candidates"][0]["place_id"]
            found_name = data["candidates"][0].get("name", "Unknown")
            found_address = data["candidates"][0].get("formatted_address", "Unknown")
            
            logger.info(f"Found Place ID for {cafe_name}: {place_id}")
            logger.info(f"  Google Name: {found_name}")
            logger.info(f"  Google Address: {found_address}")
            
            return {
                "name": cafe_name,
                "address": cafe_address,
                "place_id": place_id,
                "google_name": found_name,
                "google_address": found_address
            }
        else:
            # If not found, try with just the name
            logger.warning(f"Could not find {cafe_name} with full address. Trying with name only...")
            
            input_text = f"{cafe_name} Berkeley CA"
            encoded_input = quote(input_text)
            
            url = f"https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input={encoded_input}&inputtype=textquery&fields=place_id,name,formatted_address&key={api_key}"
            
            response = requests.get(url)
            data = response.json()
            
            if data.get("status") == "OK" and data.get("candidates"):
                place_id = data["candidates"][0]["place_id"]
                found_name = data["candidates"][0].get("name", "Unknown")
                found_address = data["candidates"][0].get("formatted_address", "Unknown")
                
                logger.info(f"Found Place ID for {cafe_name} (name only): {place_id}")
                logger.info(f"  Google Name: {found_name}")
                logger.info(f"  Google Address: {found_address}")
                
                return {
                    "name": cafe_name,
                    "address": cafe_address,
                    "place_id": place_id,
                    "google_name": found_name,
                    "google_address": found_address
                }
            else:
                logger.error(f"Could not find Place ID for {cafe_name}")
                return {
                    "name": cafe_name,
                    "address": cafe_address,
                    "place_id": None,
                    "google_name": None,
                    "google_address": None
                }
    
    except Exception as e:
        logger.error(f"Error finding Place ID for {cafe_name}: {str(e)}")
        return {
            "name": cafe_name,
            "address": cafe_address,
            "place_id": None,
            "google_name": None,
            "google_address": None
        }

def main():
    """Find Place IDs for all cafes and save to CSV."""
    
    # Get API key from environment variable
    api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    
    if not api_key:
        logger.error("GOOGLE_MAPS_API_KEY environment variable not set")
        logger.error("Please set your Google Maps API key as an environment variable")
        logger.error("Example: set GOOGLE_MAPS_API_KEY=your_api_key")
        sys.exit(1)
    
    logger.info("Finding Place IDs for cafes...")
    
    results = []
    
    for cafe in CAFES:
        result = find_place_id(cafe["name"], cafe["address"], api_key)
        results.append(result)
    
    # Save results to CSV
    csv_file = "cafe_place_ids.csv"
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["name", "address", "place_id", "google_name", "google_address"])
        writer.writeheader()
        writer.writerows(results)
    
    logger.info(f"Results saved to {csv_file}")
    
    # Also save as JSON for easier programmatic use
    json_file = "cafe_place_ids.json"
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    
    logger.info(f"Results also saved to {json_file}")
    
    # Print summary
    found_count = sum(1 for r in results if r["place_id"])
    logger.info(f"Found Place IDs for {found_count} out of {len(CAFES)} cafes")
    
    if found_count < len(CAFES):
        logger.warning("Some cafes could not be found. Check the CSV file for details.")

if __name__ == "__main__":
    main()
