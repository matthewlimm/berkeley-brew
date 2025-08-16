#!/usr/bin/env python
"""
Script to fetch popular times data for cafes and store it in the database using Supabase REST API.
This version uses Supabase REST API instead of direct PostgreSQL connection to avoid networking issues.
"""

import os
import json
import time
import random
import logging
import argparse
import csv
from datetime import datetime
import populartimes
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Google API key for geocoding and place details
API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")

# Check if required environment variables are provided
if not API_KEY:
    logger.error("GOOGLE_MAPS_API_KEY environment variable not set")
    logger.error("Please set your Google Maps API key as an environment variable")
    logger.error("Example: export GOOGLE_MAPS_API_KEY=your_api_key")
    exit(1)

if not SUPABASE_URL:
    logger.error("SUPABASE_URL environment variable not set")
    exit(1)

if not SUPABASE_ANON_KEY:
    logger.error("SUPABASE_ANON_KEY environment variable not set") 
    exit(1)

def get_supabase_headers():
    """Get headers for Supabase REST API requests."""
    return {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
    }

def get_cafes_from_supabase():
    """Fetch all cafes from Supabase using REST API."""
    try:
        url = f"{SUPABASE_URL}/rest/v1/cafes"
        params = {'select': 'id,name,address,latitude,longitude'}
        headers = get_supabase_headers()
        
        response = requests.get(url, params=params, headers=headers)
        response.raise_for_status()
        
        cafes = response.json()
        logger.info(f"Fetched {len(cafes)} cafes from Supabase")
        return [(cafe['id'], cafe['name'], cafe['address'], cafe['latitude'], cafe['longitude']) 
                for cafe in cafes]
    except Exception as e:
        logger.error(f"Error fetching cafes from Supabase: {e}")
        raise

def update_cafe_popular_times_supabase(cafe_id, popular_times_data):
    """Update the popular times data for a cafe using Supabase REST API."""
    try:
        url = f"{SUPABASE_URL}/rest/v1/cafes"
        headers = get_supabase_headers()
        
        data = {
            'popular_times': popular_times_data,
            'popular_times_updated_at': datetime.now().isoformat()
        }
        
        params = {'id': f'eq.{cafe_id}'}
        
        response = requests.patch(url, params=params, headers=headers, json=data)
        response.raise_for_status()
        
        logger.info(f"Updated popular times for cafe {cafe_id} via Supabase REST API")
    except Exception as e:
        logger.error(f"Error updating cafe {cafe_id} via Supabase REST API: {e}")

def load_place_ids_from_csv():
    """Load place IDs from the CSV file."""
    place_ids = {}
    # Resolve CSV path robustly: prefer script directory, then repo path, then CWD
    script_dir = os.path.dirname(__file__)
    candidates = [
        os.path.join(script_dir, "cafe_place_ids.csv"),
        os.path.join(os.getcwd(), "packages/api/scripts/cafe_place_ids.csv"),
        os.path.join(os.getcwd(), "cafe_place_ids.csv"),
    ]
    csv_file = next((p for p in candidates if os.path.exists(p)), candidates[0])
    
    try:
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                if row.get('place_id') and row.get('name'):
                    place_ids[row['name']] = {
                        'place_id': row['place_id'],
                        'google_name': row.get('google_name', row['name']),
                        'google_address': row.get('google_address', row.get('address', ''))
                    }
        logger.info(f"Loaded {len(place_ids)} place IDs from {csv_file}")
        return place_ids
    except Exception as e:
        logger.error(f"Error loading place IDs from CSV: {e}")
        return {}

def fetch_popular_times(name, address, lat, lng, place_id=None):
    """Fetch popular times data for a location using the populartimes library."""
    # Helper: resolve a canonical Google Place ID using Places API Find Place (textquery)
    def _resolve_place_id(q_name, q_address=None, q_lat=None, q_lng=None):
        try:
            import json
            import urllib.parse
            import urllib.request

            query = q_name.strip()
            if q_address:
                query = f"{query} {q_address}".strip()

            params = {
                "input": query,
                "inputtype": "textquery",
                "fields": "place_id,formatted_address,name",
                "key": API_KEY,
            }

            # Add location bias if coordinates provided to improve accuracy
            if q_lat is not None and q_lng is not None:
                # Bias to a small circle around the provided lat/lng (500m)
                params["locationbias"] = f"circle:500@{q_lat},{q_lng}"

            url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json?" + urllib.parse.urlencode(params)
            with urllib.request.urlopen(url, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            status = data.get("status")
            candidates = data.get("candidates", [])
            if status == "OK" and candidates:
                pid = candidates[0].get("place_id")
                gname = candidates[0].get("name")
                gaddr = candidates[0].get("formatted_address")
                logger.info(f"Resolved place_id for {q_name}: {pid} (Google name: {gname}, addr: {gaddr})")
                return pid
            else:
                logger.warning(f"Find Place returned status={status} for {q_name} (candidates={len(candidates)})")
                return None
        except Exception as e:
            logger.error(f"Error resolving place_id for {q_name}: {e}")
            return None

    try:
        # Always resolve via Google Places Find Place API by default
        logger.info(f"Resolving place ID for {name} via Google Places Find Place API (default)")
        resolved_place_id = _resolve_place_id(name, address, lat, lng)

        # Fallback to provided place_id if resolution failed
        if not resolved_place_id and place_id:
            logger.warning(f"Find Place failed for {name}; falling back to provided place_id={place_id}")
            resolved_place_id = place_id

        if not resolved_place_id:
            logger.error(f"Could not resolve place ID for {name}; skipping populartimes fetch")
            return None

        # Fetch popular times using the canonical place_id
        logger.info(f"Fetching popular times for {name} using place ID: {resolved_place_id}")
        result = populartimes.get_id(API_KEY, resolved_place_id)
        return result
    except Exception as e:
        logger.error(f"Error fetching popular times for {name}: {e}")
        return None
        
def create_empty_popular_times_data(name, address):
    """Create empty popular times data structure for cafes with no data."""
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    empty_hours = [0] * 24  # 0% busy for all hours
    
    populartimes_data = []
    for day in days:
        populartimes_data.append({
            "name": day,
            "data": empty_hours
        })
    
    return {
        "name": name,
        "address": address,
        "populartimes": populartimes_data,
        "is_mock_data": True  # Flag to indicate this is mock data
    }

def process_cafes(limit=None, use_place_ids=True, use_empty_data=True):
    """Process all cafes and update their popular times data."""
    cafes = get_cafes_from_supabase()
    place_ids = load_place_ids_from_csv() if use_place_ids else {}
    
    if limit:
        cafes = cafes[:limit]
    
    logger.info(f"Processing {len(cafes)} cafes")
    
    for i, (cafe_id, name, address, lat, lng) in enumerate(cafes):
        logger.info(f"Processing cafe {i+1}/{len(cafes)}: {name}")
        
        # Add random delay to avoid being blocked
        delay = random.uniform(2, 5)
        time.sleep(delay)
        
        # Check if we have a place ID for this cafe
        place_id_info = place_ids.get(name)
        place_id = place_id_info['place_id'] if place_id_info else None
        
        if place_id:
            logger.info(f"Found place ID for {name}: {place_id}")
            popular_times_data = fetch_popular_times(name, address, lat, lng, place_id)
        else:
            logger.warning(f"No place ID found for {name}, trying without place ID")
            popular_times_data = fetch_popular_times(name, address, lat, lng)
        
        if popular_times_data and "populartimes" in popular_times_data:
            update_cafe_popular_times_supabase(cafe_id, popular_times_data)
            logger.info(f"Updated popular times for {name}")
        else:
            if use_empty_data:
                # Create empty data structure for cafes with no popular times
                logger.warning(f"No popular times data found for {name}, using empty data")
                empty_data = create_empty_popular_times_data(name, address)
                update_cafe_popular_times_supabase(cafe_id, empty_data)
                logger.info(f"Updated with empty popular times for {name}")
            else:
                logger.warning(f"No popular times data found for {name}, skipping")

def main():
    parser = argparse.ArgumentParser(description='Fetch popular times data for cafes using Supabase REST API')
    parser.add_argument('--limit', type=int, help='Limit the number of cafes to process')
    parser.add_argument('--no-place-ids', action='store_true', help='Do not use place IDs from CSV')
    parser.add_argument('--no-empty-data', action='store_true', help='Do not use empty data for cafes with no popular times')
    args = parser.parse_args()
    
    # Test Supabase connection first
    try:
        logger.info("Testing Supabase connection...")
        cafes = get_cafes_from_supabase()
        logger.info(f"✅ Supabase connection successful! Found {len(cafes)} cafes")
    except Exception as e:
        logger.error(f"❌ Supabase connection failed: {e}")
        exit(1)
    
    process_cafes(
        limit=args.limit,
        use_place_ids=not args.no_place_ids,
        use_empty_data=not args.no_empty_data
    )

if __name__ == "__main__":
    main()
