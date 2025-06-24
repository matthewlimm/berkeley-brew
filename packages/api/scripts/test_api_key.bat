@echo off
echo Testing Google Maps API key...
set /p GOOGLE_MAPS_API_KEY="Enter your Google Maps API key: "
python test_api_key.py
pause
