"""
Database configuration for popular times scripts
This file contains connection details for your Supabase PostgreSQL database
"""

import os

# Supabase database connection parameters
# Update these with your actual Supabase database credentials
DB_CONFIG = {
    "host": os.environ.get("DB_HOST", "aws-0-us-west-1.pooler.supabase.com"),
    "port": os.environ.get("DB_PORT", "5432"),
    "dbname": os.environ.get("DB_NAME", "postgres"),
    "user": os.environ.get("DB_USER", "postgres.vbtvfxvthhsjanfeojjt"),
    "password": os.environ.get("DB_PASSWORD", "")  # Set this via environment variable for security
}

# Add this to your .env file:
# DB_PASSWORD=your_supabase_db_password
