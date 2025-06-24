@echo off
echo Generating mock popular times data for all cafes...
REM Set your DB_PASSWORD as an environment variable before running this script
REM Example: set DB_PASSWORD=your_password
python mock_popular_times.py
echo Done!
