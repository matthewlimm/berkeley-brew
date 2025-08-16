# Berkeley Brew Cafe Data Scripts

This directory contains scripts for fetching and updating popular times data for cafes in the Berkeley Brew application.

## Files

### Core Script
- **`fetch_popular_times_supabase.py`** - Main script that fetches popular times data from Google Maps and updates the Supabase database via REST API

### Data Files
- **`cafe_place_ids.csv`** - Contains mapping of cafe names to Google Place IDs for accurate data retrieval

### Documentation
- **`README.md`** - This file

## What `fetch_popular_times_supabase.py` Does

This script is the core automation that runs daily in GitHub Actions. Here's what it does:

### 1. **Fetches Cafe Data**
- Connects to your Supabase database via REST API
- Retrieves all cafes (18 total) with their names, addresses, and coordinates

### 2. **Gets Google Place IDs** 
- Loads pre-mapped Place IDs from `cafe_place_ids.csv`
- For cafes without Place IDs, uses Google Places API to find them
- Uses location bias with latitude/longitude for accuracy

### 3. **Fetches Popular Times Data**
- Uses the `populartimes` Python library to scrape Google Maps
- Gets hourly busyness data for each day of the week (Monday-Sunday)
- Each hour gets a 0-100% busyness rating

### 4. **Updates Database**
- Stores popular times data as JSON in the `popular_times` column
- Updates `popular_times_updated_at` timestamp
- For cafes with no data, creates empty placeholder data

### 5. **Rate Limiting & Safety**
- Adds 2-5 second delays between API calls to avoid being blocked
- Handles errors gracefully and continues processing other cafes
- Comprehensive logging for debugging

## Environment Setup

The script requires these environment variables (already configured in GitHub Actions):

```bash
# Google Maps API Key for popular times data
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Supabase connection for database access
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage

### GitHub Actions (Automatic)
- Runs daily at midnight UTC via `.github/workflows/popular_times.yml`
- Processes all 18 cafes automatically
- Takes about 1.5-2 minutes to complete

### Manual Execution
```bash
# Process all cafes
python packages/api/scripts/fetch_popular_times_supabase.py

# Process only 5 cafes (for testing)
python packages/api/scripts/fetch_popular_times_supabase.py --limit 5

# Skip CSV place IDs (slower, uses API lookup)
python packages/api/scripts/fetch_popular_times_supabase.py --no-place-ids

# Skip empty data creation for cafes with no popular times
python packages/api/scripts/fetch_popular_times_supabase.py --no-empty-data
```

## Data Format

Popular times data is stored in the database as JSON:

```json
{
  "name": "Cafe Name",
  "address": "Cafe Address", 
  "populartimes": [
    {
      "name": "Monday",
      "data": [0, 0, 0, 0, 0, 0, 10, 20, 40, 60, 70, 80, 70, 60, 50, 40, 50, 70, 60, 40, 20, 10, 0, 0]
    },
    {
      "name": "Tuesday", 
      "data": [0, 0, 0, 0, 0, 0, 15, 25, 45, 65, 75, 85, 75, 65, 55, 45, 55, 75, 65, 45, 25, 15, 0, 0]
    }
    // ... (Wednesday through Sunday)
  ]
}
```

Each element in the `data` array represents the busyness percentage for that hour (0-23), where:
- `0` = not busy at all
- `100` = extremely busy
- Hours when the cafe is closed typically show `0`

## Troubleshooting

### Common Issues
1. **Rate limiting**: Google may temporarily block requests if too many are made
   - Solution: The script has built-in delays to prevent this
   
2. **Missing Place IDs**: Some cafes may not be found in Google Maps
   - Solution: Manually add Place IDs to `cafe_place_ids.csv`
   
3. **No popular times data**: Some cafes don't have Google popular times data
   - Solution: Script creates empty data structure as fallback

### Logs
The script provides detailed logging to help debug issues:
- Connection status
- Processing progress for each cafe
- API responses and errors
- Database update confirmations

## Security Notes

- Environment variables are stored as GitHub repository secrets
- Never commit API keys or credentials to the repository
- The script uses Supabase's anon key with proper RLS policies
