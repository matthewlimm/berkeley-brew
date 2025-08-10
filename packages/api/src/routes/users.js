"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const users_1 = require("../controllers/users");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All user routes require authentication
router.use(auth_1.requireAuth);
// Get current user profile
router.get('/profile', users_1.getCurrentUser);
// Update current user profile
router.patch('/profile', users_1.updateUserProfile);
// Get user reviews
router.get('/reviews', users_1.getUserReviews);
exports.default = router;
