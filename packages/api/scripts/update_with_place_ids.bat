@echo off
echo Running Popular Times Update with Place IDs...
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

REM Check if DB password is set
if "%DB_PASSWORD%"=="" (
    echo WARNING: DB_PASSWORD environment variable is not set.
    echo If your database requires a password, please set it using:
    echo.
    echo     set DB_PASSWORD=your_db_password
    echo.
    echo Press any key to continue anyway or Ctrl+C to cancel...
    pause > nul
)

python fetch_popular_times.py
echo.
echo If successful, the database has been updated with popular times data.
echo Cafes with no available popular times data have been given empty data.
pause
