"""
Database configuration for popular times scripts
This file contains connection details for your Supabase PostgreSQL database
"""

import os
from urllib.parse import urlparse

def get_db_config():
    """Get database configuration from environment variables."""
    
    # First try to use DATABASE_URL if available (common in GitHub Actions)
    database_url = os.environ.get("DATABASE_URL")
    if database_url:
        parsed = urlparse(database_url)
        return {
            "host": parsed.hostname,
            "port": str(parsed.port) if parsed.port else "5432",
            "dbname": parsed.path.lstrip('/') if parsed.path else "postgres",
            "user": parsed.username,
            "password": parsed.password,
            "sslmode": "require",
        }
    
    # Fallback to individual environment variables
    return {
        "host": os.environ.get("PGHOST", "db.vbtvfxvthhsjanfeojjt.supabase.co"),
        "port": os.environ.get("PGPORT", "5432"),
        "dbname": os.environ.get("PGDATABASE", "postgres"),
        "user": os.environ.get("PGUSER", "postgres"),
        "password": os.environ.get("PGPASSWORD", ""),
        "sslmode": os.environ.get("DB_SSLMODE", "require"),
    }

# For backward compatibility
DB_CONFIG = get_db_config()
