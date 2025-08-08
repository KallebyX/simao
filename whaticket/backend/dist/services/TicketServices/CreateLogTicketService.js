"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const LogTicket_1 = __importDefault(require("../../models/LogTicket"));
const CreateLogTicketService = async ({ type, userId, ticketId, queueId }) => {
    await LogTicket_1.default.create({
        userId: userId ? Number(userId) : undefined,
        ticketId: Number(ticketId),
        type,
        queueId: queueId ? Number(queueId) : undefined
    });
};
exports.default = CreateLogTicketService;
//# sourceMappingURL=CreateLogTicketService.js.map