"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const reviews_1 = require("../controllers/reviews");
const router = (0, express_1.Router)();
// PATCH /api/reviews/:id - update a review (authenticated)
router.patch('/:id', auth_1.requireAuth, reviews_1.updateReview);
exports.default = router;
