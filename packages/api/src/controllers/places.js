"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpeningHours = void 0;
const errorHandler_1 = require("../middleware/errorHandler");
// Google Places API key
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const getOpeningHours = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { placeId } = req.query;
        if (!placeId) {
            return next(new errorHandler_1.AppError('Place ID is required', 400));
        }
        if (!GOOGLE_MAPS_API_KEY) {
            return next(new errorHandler_1.AppError('Google Maps API key is not configured', 500));
        }
        // Call Google Places API to get details including opening hours
        const response = yield fetch(`https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=opening_hours,name&key=${GOOGLE_MAPS_API_KEY}`);
        if (!response.ok) {
            return next(new errorHandler_1.AppError(`Google Places API error: ${response.statusText}`, 500));
        }
        const data = yield response.json();
        if (data.status !== 'OK' || !data.result) {
            return next(new errorHandler_1.AppError(`Google Places API error: ${data.status || 'Unknown error'}`, 500));
        }
        const placeDetails = data.result;
        const openingHours = placeDetails.opening_hours;
        if (!openingHours) {
            return res.status(200).json({
                status: 'success',
                data: {
                    isOpen: false,
                    status: 'unknown',
                    statusText: 'Hours not available',
                    hoursToday: null
                }
            });
        }
        const now = new Date();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        // Get today's hours from the periods array
        const todayHours = openingHours.periods.find((period) => period.open && period.open.day === currentDay);
        // Format hours for display
        const formatTime = (timeStr) => {
            const hour = parseInt(timeStr.substring(0, 2));
            const minute = timeStr.substring(2);
            const period = hour >= 12 ? 'PM' : 'AM';
            const hour12 = hour % 12 || 12;
            return `${hour12}${minute === '00' ? '' : `:${minute}`}${period}`;
        };
        let hoursToday;
        if (todayHours && todayHours.open && todayHours.close) {
            const openTime = formatTime(todayHours.open.time);
            const closeTime = formatTime(todayHours.close.time);
            hoursToday = `${openTime} - ${closeTime}`;
        }
        // Check if the place is currently open
        const isOpen = openingHours.open_now || false;
        // Determine if it's "opening soon" or "closing soon" (within 1 hour)
        let status = isOpen ? 'open' : 'closed';
        if (todayHours && todayHours.open && todayHours.close) {
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentTimeMinutes = currentHour * 60 + currentMinute;
            // Parse opening and closing times
            const openHour = parseInt(todayHours.open.time.substring(0, 2));
            const openMinute = parseInt(todayHours.open.time.substring(2));
            const openTimeMinutes = openHour * 60 + openMinute;
            const closeHour = parseInt(todayHours.close.time.substring(0, 2));
            const closeMinute = parseInt(todayHours.close.time.substring(2));
            const closeTimeMinutes = closeHour * 60 + closeMinute;
            // Check if opening soon (within 1 hour)
            if (!isOpen && (openTimeMinutes - currentTimeMinutes <= 60) && (openTimeMinutes - currentTimeMinutes > 0)) {
                status = 'opening-soon';
            }
            // Check if closing soon (within 1 hour)
            if (isOpen && (closeTimeMinutes - currentTimeMinutes <= 60) && (closeTimeMinutes - currentTimeMinutes > 0)) {
                status = 'closing-soon';
            }
        }
        // Create status text
        let statusText;
        switch (status) {
            case 'open':
                statusText = 'Open';
                break;
            case 'closed':
                statusText = 'Closed';
                break;
            case 'opening-soon':
                statusText = 'Opening Soon';
                break;
            case 'closing-soon':
                statusText = 'Closing Soon';
                break;
        }
        res.status(200).json({
            status: 'success',
            data: {
                isOpen,
                status,
                statusText,
                hoursToday
            }
        });
    }
    catch (error) {
        console.error('Error fetching place hours:', error);
        next(new errorHandler_1.AppError('Failed to fetch opening hours', 500));
    }
});
exports.getOpeningHours = getOpeningHours;
