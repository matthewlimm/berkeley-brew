@echo off
echo Updating popular times data for cafes...
python scripts/fetch_popular_times.py --limit 5
echo Done!
