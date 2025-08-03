"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBullAuth = void 0;
require("./bootstrap");
require("reflect-metadata");
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const compression_1 = __importDefault(require("compression"));
const Sentry = __importStar(require("@sentry/node"));
const dotenv_1 = require("dotenv");
const body_parser_1 = __importDefault(require("body-parser"));
require("./database");
const upload_1 = __importDefault(require("./config/upload"));
const AppError_1 = __importDefault(require("./errors/AppError"));
const routes_1 = __importDefault(require("./routes"));
const logger_1 = __importDefault(require("./utils/logger"));
const queues_1 = require("./queues");
const queue_1 = __importDefault(require("./libs/queue"));
const api_1 = require("@bull-board/api");
const bullAdapter_1 = require("@bull-board/api/bullAdapter");
const express_2 = require("@bull-board/express");
const basic_auth_1 = __importDefault(require("basic-auth"));
const isBullAuth = (req, res, next) => {
    const user = (0, basic_auth_1.default)(req);
    if (!user || user.name !== process.env.BULL_USER || user.pass !== process.env.BULL_PASS) {
        res.set('WWW-Authenticate', 'Basic realm="example"');
        return res.status(401).send('Authentication required.');
    }
    next();
};
exports.isBullAuth = isBullAuth;
(0, dotenv_1.config)();
Sentry.init({ dsn: process.env.SENTRY_DSN });
const app = (0, express_1.default)();
app.set("queues", {
    messageQueue: queues_1.messageQueue,
    sendScheduledMessages: queues_1.sendScheduledMessages
});
const allowedOrigins = [process.env.FRONTEND_URL];
if (String(process.env.BULL_BOARD).toLocaleLowerCase() === 'true' && process.env.REDIS_URI_ACK !== '') {
    const serverAdapter = new express_2.ExpressAdapter();
    serverAdapter.setBasePath('/admin/queues');
    (0, api_1.createBullBoard)({
        queues: queue_1.default.queues.map(queue => new bullAdapter_1.BullAdapter(queue.bull)),
        serverAdapter: serverAdapter,
    });
    app.use('/admin/queues', exports.isBullAuth, serverAdapter.getRouter());
}
app.use((0, compression_1.default)());
app.use(body_parser_1.default.json({ limit: '5mb' }));
app.use(body_parser_1.default.urlencoded({ limit: '5mb', extended: true }));
app.use((0, cors_1.default)({
    credentials: true,
    origin: allowedOrigins
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(Sentry.Handlers.requestHandler());
app.use("/public", express_1.default.static(upload_1.default.directory));
app.use(routes_1.default);
app.use(Sentry.Handlers.errorHandler());
app.use(async (err, req, res, _) => {
    if (err instanceof AppError_1.default) {
        logger_1.default.warn(err);
        return res.status(err.statusCode).json({ error: err.message });
    }
    logger_1.default.error(err);
    return res.status(500).json({ error: "Internal server error" });
});
exports.default = app;
//# sourceMappingURL=app.js.map