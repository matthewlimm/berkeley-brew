"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const places_1 = require("../controllers/places");
const router = express_1.default.Router();
// Get opening hours for a place
router.get('/hours', places_1.getOpeningHours);
exports.default = router;
