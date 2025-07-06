"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cafes_1 = require("../controllers/cafes");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.get('/', cafes_1.getAllCafes);
router.get('/:id', cafes_1.getCafeById);
// Protected routes - require authentication
router.post('/:id/reviews', auth_1.requireAuth, cafes_1.addCafeReview);
router.put('/reviews/:reviewId', auth_1.requireAuth, cafes_1.updateReview);
router.delete('/reviews/:reviewId', auth_1.requireAuth, cafes_1.deleteReview);
exports.default = router;
