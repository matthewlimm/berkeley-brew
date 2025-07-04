"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const posts_1 = require("../controllers/posts");
const router = (0, express_1.Router)();
router.post('/:id/post', posts_1.makeCoffeePost);
router.get('/', posts_1.getAllPosts);
// router.get('/:id', getP)
exports.default = router;
