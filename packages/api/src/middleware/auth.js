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
exports.requireAuth = void 0;
const db_1 = require("../db");
const errorHandler_1 = require("./errorHandler");
const requireAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Debug auth headers
        console.log('Auth headers received:', {
            authorization: !!req.headers.authorization,
            cookie: !!req.headers.cookie
        });
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(new errorHandler_1.AppError('Authentication required', 401));
        }
        const token = authHeader.split(' ')[1];
        console.log('Token received:', token.substring(0, 10) + '...');
        const { data, error } = yield db_1.supabase.auth.getUser(token);
        if (error) {
            console.log('Auth error:', error.message);
            return next(new errorHandler_1.AppError('Invalid or expired token', 401));
        }
        if (!data.user) {
            console.log('No user found with token');
            return next(new errorHandler_1.AppError('User not found', 401));
        }
        console.log('User authenticated:', data.user.email);
        // Add user to request object
        req.user = data.user;
        next();
    }
    catch (err) {
        console.error('Auth error:', err);
        next(new errorHandler_1.AppError('Authentication failed', 401));
    }
});
exports.requireAuth = requireAuth;
