"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initIO = void 0;
const socket_io_1 = require("socket.io");
const AppError_1 = __importDefault(require("../errors/AppError"));
const admin_ui_1 = require("@socket.io/admin-ui");
const User_1 = __importDefault(require("../models/User"));
let io;
const initIO = (httpServer) => {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL
        }
    });
    if (process.env.SOCKET_ADMIN && JSON.parse(process.env.SOCKET_ADMIN)) {
        User_1.default.findByPk(1).then((adminUser) => {
            (0, admin_ui_1.instrument)(io, {
                auth: {
                    type: "basic",
                    username: adminUser.email,
                    password: adminUser.passwordHash
                },
                mode: "development",
            });
        });
    }
    const workspaces = io.of(/^\/\w+$/);
    workspaces.on("connection", socket => {
        const { userId } = socket.handshake.query;
        socket.on("joinChatBox", (ticketId) => {
            socket.join(ticketId);
        });
        socket.on("joinNotification", () => {
            socket.join("notification");
        });
        socket.on("joinTickets", (status) => {
            socket.join(status);
        });
        socket.on("joinTicketsLeave", (status) => {
            socket.leave(status);
        });
        socket.on("joinChatBoxLeave", (ticketId) => {
            socket.leave(ticketId);
        });
        socket.on("disconnect", () => {
        });
    });
    return io;
};
exports.initIO = initIO;
const getIO = () => {
    if (!io) {
        throw new AppError_1.default("Socket IO not initialized");
    }
    return io;
};
exports.getIO = getIO;
//# sourceMappingURL=socket.js.map