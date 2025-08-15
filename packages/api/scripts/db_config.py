"""
Database configuration for popular times scripts
This file contains connection details for your Supabase PostgreSQL database
"""

import os

# Supabase database connection parameters
# Update these with your actual Supabase database credentials
DB_CONFIG = {
    # Prefer direct DB host (as shown in Supabase connection string)
    # Example: postgresql://postgres:[YOUR-PASSWORD]@db.<ref>.supabase.co:5432/postgres
    "host": os.environ.get("DB_HOST", "db.vbtvfxvthhsjanfeojjt.supabase.co"),
    "port": os.environ.get("DB_PORT", "5432"),
    "dbname": os.environ.get("DB_NAME", "postgres"),
    "user": os.environ.get("DB_USER", "postgres"),
    "password": os.environ.get("DB_PASSWORD", ""),  # Set via environment variable
    # Ensure SSL for Supabase
    "sslmode": os.environ.get("DB_SSLMODE", "require"),
}
