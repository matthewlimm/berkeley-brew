# Berkeley Brew Cafe Data Scripts

This directory contains scripts for fetching, generating, and managing cafe data for the Berkeley Brew application, including place IDs, business hours, and popular times data.

## Environment Setup

Before running any scripts, you need to set up the following environment variables:

### Database Credentials

Set your Supabase database password:

```bash
# Windows
set DB_PASSWORD=your_supabase_password

# Unix/Mac
export DB_PASSWORD=your_supabase_password
```

### Google Maps API Key

For fetching real popular times data, you need a Google Maps API key:

```bash
# Windows
set GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Unix/Mac
export GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Available Scripts

### Main Script (Recommended)

- `update_cafe_data.js` - **Comprehensive script** that updates all cafe data in one go:
  - Place IDs from Google Places API
  - Business hours from Google Places API
  - Popular times data from Google Maps

  ```bash
  # Run the comprehensive update script
  node packages/api/scripts/update_cafe_data.js
  ```

### Legacy Scripts

- `check_format.bat` - Checks the format of popular times data in the database
- `run_mock_data.bat` - Generates mock popular times data for all cafes
- `run_test.bat` - Tests the popular times feature
- `update_popular_times.bat` - Updates popular times data from Google Maps

## Security Notes

- **NEVER** commit API keys or database passwords to the repository
- Always use environment variables for sensitive information
- Consider using a `.env` file (added to `.gitignore`) for local development

## Data Format

Popular times data is stored in the database as a JSON array with the following structure:

```json
[
  {
    "name": "Monday",
    "data": [0, 0, 0, 0, 0, 0, 10, 20, 40, 60, 70, 80, 70, 60, 50, 40, 50, 70, 60, 40, 20, 10, 0, 0]
  },
  {
    "name": "Tuesday",
    "data": [0, 0, 0, 0, 0, 0, 10, 20, 40, 60, 70, 80, 70, 60, 50, 40, 50, 70, 60, 40, 20, 10, 0, 0]
  },
  ...
]
```

Each element in the `data` array represents the busyness percentage for that hour (0-23).
