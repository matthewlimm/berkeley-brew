#!/usr/bin/env python
"""
Mock popular times data generator
This script creates realistic mock popular times data for cafes
"""

import os
import json
import random
from datetime import datetime
import psycopg2
from psycopg2.extras import Json
import logging
from db_config import DB_CONFIG

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_db_connection():
    """Create a connection to the database."""
    try:
        password = DB_CONFIG["password"] or os.environ.get("DB_PASSWORD", "")
        conn = psycopg2.connect(
            host=DB_CONFIG["host"],
            port=DB_CONFIG["port"],
            dbname=DB_CONFIG["dbname"],
            user=DB_CONFIG["user"],
            password=password
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise

def get_cafes_from_db():
    """Fetch all cafes from the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, name, address
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

def generate_mock_popular_times(cafe_name):
    """Generate realistic mock popular times data for a cafe."""
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    
    # Generate different patterns for weekdays vs weekends
    popular_times = []
    
    for day_index, day in enumerate(days):
        is_weekend = day_index >= 5  # Saturday and Sunday
        
        # Generate hourly data (0-23 hours)
        hourly_data = []
        for hour in range(24):
            if hour < 6:  # Before 6am
                value = random.randint(0, 5)
            elif 6 <= hour < 9:  # Morning rush
                value = random.randint(20, 60)
            elif 9 <= hour < 12:  # Late morning
                value = random.randint(50, 90) if is_weekend else random.randint(70, 100)
            elif 12 <= hour < 14:  # Lunch rush
                value = random.randint(80, 100)
            elif 14 <= hour < 17:  # Afternoon
                value = random.randint(40, 70)
            elif 17 <= hour < 20:  # Evening
                value = random.randint(60, 90) if is_weekend else random.randint(40, 70)
            elif 20 <= hour < 22:  # Night
                value = random.randint(30, 50) if is_weekend else random.randint(20, 40)
            else:  # Late night
                value = random.randint(0, 15)
            
            hourly_data.append(value)
        
        popular_times.append({
            "name": day,
            "data": hourly_data
        })
    
    # Create a complete mock response similar to what the populartimes library would return
    mock_data = {
        "name": cafe_name,
        "address": "Mock Address",
        "coordinates": {
            "lat": 37.8715,
            "lng": -122.2730
        },
        "populartimes": popular_times,
        "rating": round(random.uniform(3.5, 5.0), 1),
        "rating_n": random.randint(50, 500)
    }
    
    return mock_data

def update_cafe_popular_times(cafe_id, popular_times_data):
    """Update the popular times data for a cafe in the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Update the cafe with popular times data
        cursor.execute("""
            UPDATE cafes
            SET popular_times = %s, popular_times_updated_at = %s
            WHERE id = %s
        """, (Json(popular_times_data), datetime.now(), cafe_id))
        
        conn.commit()
        logger.info(f"Updated popular times for cafe {cafe_id}")
        return True
    except Exception as e:
        conn.rollback()
        logger.error(f"Error updating cafe {cafe_id}: {e}")
        return False
    finally:
        cursor.close()
        conn.close()

def main():
    """Main function to generate and store mock popular times data."""
    logger.info("Starting mock popular times generation")
    
    try:
        cafes = get_cafes_from_db()
        logger.info(f"Found {len(cafes)} cafes in the database")
        
        for cafe_id, name, address in cafes:
            logger.info(f"Generating mock data for {name}")
            
            # Generate mock data
            mock_data = generate_mock_popular_times(name)
            
            # Save to database
            success = update_cafe_popular_times(cafe_id, mock_data)
            
            if success:
                logger.info(f"Successfully updated {name}")
            else:
                logger.warning(f"Failed to update {name}")
        
        logger.info("Mock data generation completed successfully")
    except Exception as e:
        logger.error(f"Error in main execution: {e}")

if __name__ == "__main__":
    main()
