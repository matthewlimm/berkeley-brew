import express from 'express';
import { getOpeningHours } from '../controllers/places';

const router = express.Router();

// Get opening hours for a place
router.get('/hours', getOpeningHours);

export default router;
