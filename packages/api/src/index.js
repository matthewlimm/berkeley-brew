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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Load environment variables first
require("./config/env");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const cafes_1 = __importDefault(require("./routes/cafes"));
const posts_1 = __importDefault(require("./routes/posts"));
const users_1 = __importDefault(require("./routes/users"));
const places_1 = __importDefault(require("./routes/places"));
const bookmarks_1 = __importDefault(require("./routes/bookmarks"));
const app = (0, express_1.default)();
const port = 3001; // Fixed port for API server
const maxRetries = 3;
let currentPort = port;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
// Routes
app.use('/api/cafes', cafes_1.default);
app.use('/api/posts', posts_1.default);
app.use('/api/user', users_1.default);
app.use('/api/places', places_1.default);
app.use('/api/bookmarks', bookmarks_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Error handling
app.use(errorHandler_1.default);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Not Found'
    });
});
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            yield new Promise((resolve, reject) => {
                const server = app.listen(currentPort, () => {
                    console.log(`🚀 API server running on port ${currentPort}`);
                    resolve(true);
                });
                server.on('error', (error) => {
                    if (error.code === 'EADDRINUSE') {
                        const nextPort = currentPort + 1;
                        console.log(`Port ${currentPort} is in use, trying ${nextPort}`);
                        currentPort = nextPort;
                        server.close();
                        reject(error);
                    }
                    else {
                        reject(error);
                    }
                });
            });
            return; // Server started successfully
        }
        catch (error) {
            if (attempt === maxRetries - 1) {
                console.error(`Failed to start server after ${maxRetries} attempts`);
                process.exit(1);
            }
            // Continue to next attempt
        }
    }
});
startServer();
