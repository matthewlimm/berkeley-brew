#!/usr/bin/env python
"""
Simple database connection test
"""

import os
import psycopg2

def test_connection():
    """Test database connection with your credentials"""
    
    # You need to set these environment variables
    google_api_key = os.environ.get("GOOGLE_MAPS_API_KEY")
    database_url = os.environ.get("DATABASE_URL")
    
    print("=== Database Connection Test ===")
    print(f"Google API Key set: {'Yes' if google_api_key else 'No'}")
    print(f"Database URL set: {'Yes' if database_url else 'No'}")
    
    if not google_api_key:
        print("❌ GOOGLE_MAPS_API_KEY not set")
        return False
    
    if not database_url:
        print("❌ DATABASE_URL not set")
        return False
    
    try:
        print(f"Attempting connection to database...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Test basic connection
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Connected! PostgreSQL version: {version[0][:50]}...")
        
        # Test if cafes table exists
        cursor.execute("""
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_name = 'cafes'
        """)
        table_exists = cursor.fetchone()[0]
        
        if table_exists:
            cursor.execute("SELECT COUNT(*) FROM cafes")
            cafe_count = cursor.fetchone()[0]
            print(f"✅ Found cafes table with {cafe_count} cafes")
        else:
            print("❌ Cafes table not found")
        
        cursor.close()
        conn.close()
        print("✅ Connection test successful!")
        return True
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    if not success:
        print("\nTo fix this, set your environment variables:")
        print("export GOOGLE_MAPS_API_KEY=your_api_key_here")
        print("export DATABASE_URL='postgresql://postgres:your_password@db.vbtvfxvthhsjanfeojjt.supabase.co:5432/postgres?sslmode=require'")
        exit(1)
    else:
        print("\n🎉 Ready to run the popular times script!")
