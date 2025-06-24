#!/usr/bin/env python
"""
Script to fetch popular times data for cafes and store it in the database.
This script uses place IDs from cafe_place_ids.csv and handles cafes with no popular times data.
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
import psycopg2
from psycopg2.extras import Json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Google API key for geocoding and place details
API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")

# Check if API key is provided
if not API_KEY:
    logger.error("GOOGLE_MAPS_API_KEY environment variable not set")
    logger.error("Please set your Google Maps API key as an environment variable")
    logger.error("Example: export GOOGLE_MAPS_API_KEY=your_api_key")
    exit(1)

# Import database configuration
from db_config import DB_CONFIG

# Get database connection parameters from config
DB_HOST = DB_CONFIG["host"]
DB_PORT = DB_CONFIG["port"]
DB_NAME = DB_CONFIG["dbname"]
DB_USER = DB_CONFIG["user"]
DB_PASSWORD = DB_CONFIG["password"] or os.environ.get("DB_PASSWORD", "")

def get_db_connection():
    """Create a connection to the database."""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise

def load_place_ids_from_csv():
    """Load place IDs from the CSV file."""
    place_ids = {}
    csv_file = "cafe_place_ids.csv"
    
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

def get_cafes_from_db():
    """Fetch all cafes from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, name, address, latitude, longitude
            FROM cafes
        """)
        cafes = cursor.fetchall()
        return cafes
    except Exception as e:
        logger.error(f"Error fetching cafes: {e}")
        raise
    finally:
        cursor.close()
        conn.close()

def update_cafe_popular_times(cafe_id, popular_times_data):
    """Update the popular times data for a cafe in the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Check if the popular_times column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='cafes' AND column_name='popular_times'
        """)
        column_exists = cursor.fetchone()
        
        # If the column doesn't exist, create it
        if not column_exists:
            logger.info("Creating popular_times column in cafes table")
            cursor.execute("""
                ALTER TABLE cafes 
                ADD COLUMN popular_times JSONB,
                ADD COLUMN popular_times_updated_at TIMESTAMP
            """)
            conn.commit()
        
        # Update the cafe with popular times data
        cursor.execute("""
            UPDATE cafes
            SET popular_times = %s, popular_times_updated_at = %s
            WHERE id = %s
        """, (Json(popular_times_data), datetime.now(), cafe_id))
        
        conn.commit()
        logger.info(f"Updated popular times for cafe {cafe_id}")
    except Exception as e:
        conn.rollback()
        logger.error(f"Error updating cafe {cafe_id}: {e}")
    finally:
        cursor.close()
        conn.close()

def fetch_popular_times(name, address, lat, lng, place_id=None):
    """Fetch popular times data for a location using the populartimes library."""
    try:
        if place_id:
            # Try to get by place ID first (most reliable)
            logger.info(f"Fetching popular times for {name} using place ID: {place_id}")
            result = populartimes.get_id(API_KEY, place_id)
            return result
        else:
            # Fallback to search by name and address
            logger.warning(f"No place ID for {name}, trying with name and address")
            result = populartimes.get_id(API_KEY, f"{name} {address}")
            
            # If no popular times data, try again with just coordinates
            if "populartimes" not in result and lat and lng:
                result = populartimes.get_from_coordinates(API_KEY, lat, lng)
            
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
    cafes = get_cafes_from_db()
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
            update_cafe_popular_times(cafe_id, popular_times_data)
            logger.info(f"Updated popular times for {name}")
        else:
            if use_empty_data:
                # Create empty data structure for cafes with no popular times
                logger.warning(f"No popular times data found for {name}, using empty data")
                empty_data = create_empty_popular_times_data(name, address)
                update_cafe_popular_times(cafe_id, empty_data)
                logger.info(f"Updated with empty popular times for {name}")
            else:
                logger.warning(f"No popular times data found for {name}, skipping")

def main():
    parser = argparse.ArgumentParser(description='Fetch popular times data for cafes')
    parser.add_argument('--limit', type=int, help='Limit the number of cafes to process')
    parser.add_argument('--no-place-ids', action='store_true', help='Do not use place IDs from CSV')
    parser.add_argument('--no-empty-data', action='store_true', help='Do not use empty data for cafes with no popular times')
    args = parser.parse_args()
    
    process_cafes(
        limit=args.limit,
        use_place_ids=not args.no_place_ids,
        use_empty_data=not args.no_empty_data
    )

if __name__ == "__main__":
    main()
