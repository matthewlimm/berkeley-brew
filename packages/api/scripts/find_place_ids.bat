@echo off
echo Running Place ID finder for Berkeley Brew cafes...
echo.

REM Check if API key is set
if "%GOOGLE_MAPS_API_KEY%"=="" (
    echo ERROR: GOOGLE_MAPS_API_KEY environment variable is not set.
    echo Please set your Google Maps API key first using:
    echo.
    echo     set GOOGLE_MAPS_API_KEY=your_api_key_here
    echo.
    exit /b 1
)

python find_place_ids.py
echo.
echo If successful, check cafe_place_ids.csv and cafe_place_ids.json for results.
pause
