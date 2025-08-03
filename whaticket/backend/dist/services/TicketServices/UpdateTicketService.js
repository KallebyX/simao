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
const moment_1 = __importDefault(require("moment"));
const Sentry = __importStar(require("@sentry/node"));
const sequelize_1 = require("sequelize");
const SetTicketMessagesAsRead_1 = __importDefault(require("../../helpers/SetTicketMessagesAsRead"));
const socket_1 = require("../../libs/socket");
const Ticket_1 = __importDefault(require("../../models/Ticket"));
const Queue_1 = __importDefault(require("../../models/Queue"));
const ShowTicketService_1 = __importDefault(require("./ShowTicketService"));
const ShowWhatsAppService_1 = __importDefault(require("../WhatsappService/ShowWhatsAppService"));
const SendWhatsAppMessage_1 = __importDefault(require("../WbotServices/SendWhatsAppMessage"));
const FindOrCreateATicketTrakingService_1 = __importDefault(require("./FindOrCreateATicketTrakingService"));
const GetTicketWbot_1 = __importDefault(require("../../helpers/GetTicketWbot"));
const wbotMessageListener_1 = require("../WbotServices/wbotMessageListener");
const lodash_1 = require("lodash");
const sendFacebookMessage_1 = __importDefault(require("../FacebookServices/sendFacebookMessage"));
const facebookMessageListener_1 = require("../FacebookServices/facebookMessageListener");
const User_1 = __importDefault(require("../../models/User"));
const CompaniesSettings_1 = __importDefault(require("../../models/CompaniesSettings"));
const CreateLogTicketService_1 = __importDefault(require("./CreateLogTicketService"));
const CreateMessageService_1 = __importDefault(require("../MessageServices/CreateMessageService"));
const FindOrCreateTicketService_1 = __importDefault(require("./FindOrCreateTicketService"));
const Mustache_1 = __importDefault(require("../../helpers/Mustache"));
const UpdateTicketService = async ({ ticketData, ticketId, companyId }) => {
    try {
        let { queueId, userId, sendFarewellMessage = true, amountUsedBotQueues, lastMessage, integrationId, useIntegration, unreadMessages, msgTransfer, isTransfered = false, status } = ticketData;
        let isBot = ticketData.isBot || false;
        let queueOptionId = ticketData.queueOptionId || null;
        const io = (0, socket_1.getIO)();
        const settings = await CompaniesSettings_1.default.findOne({
            where: {
                companyId: companyId
            }
        });
        let ticket = await (0, ShowTicketService_1.default)(ticketId, companyId);
        if (ticket.channel === "whatsapp" && ticket.whatsappId) {
            (0, SetTicketMessagesAsRead_1.default)(ticket);
        }
        const oldStatus = ticket?.status;
        const oldUserId = ticket.user?.id;
        const oldQueueId = ticket?.queueId;
        if ((0, lodash_1.isNil)(ticket.whatsappId) && status === "closed") {
            await (0, CreateLogTicketService_1.default)({
                userId,
                queueId: ticket.queueId,
                ticketId,
                type: "closed"
            });
            await ticket.update({
                status: "closed"
            });
            io.of(String(companyId))
                .emit(`company-${ticket.companyId}-ticket`, {
                action: "delete",
                ticketId: ticket.id
            });
            console.log(117, "UpdateTicketService");
            return { ticket, oldStatus, oldUserId };
        }
        if (oldStatus === "closed") {
            console.log(122, "UpdateTicketService");
            let otherTicket = await Ticket_1.default.findOne({
                where: {
                    contactId: ticket.contactId,
                    status: { [sequelize_1.Op.or]: ["open", "pending", "group"] },
                    whatsappId: ticket.whatsappId
                }
            });
            if (otherTicket) {
                if (otherTicket.id !== ticket.id) {
                    otherTicket = await (0, ShowTicketService_1.default)(otherTicket.id, companyId);
                    return { ticket: otherTicket, oldStatus, oldUserId };
                }
            }
            isBot = false;
        }
        const ticketTraking = await (0, FindOrCreateATicketTrakingService_1.default)({
            ticketId,
            companyId,
            whatsappId: ticket?.whatsappId
        });
        const { complationMessage, ratingMessage, groupAsTicket } = await (0, ShowWhatsAppService_1.default)(ticket?.whatsappId, companyId);
        if (status !== undefined && ["closed"].indexOf(status) > -1) {
            const _userId = ticket.userId || userId;
            let user;
            if (_userId) {
                user = await User_1.default.findByPk(_userId);
            }
            if (settings.userRating === "enabled" &&
                (sendFarewellMessage || sendFarewellMessage === undefined) &&
                (!(0, lodash_1.isNil)(ratingMessage) && ratingMessage !== "") &&
                !ticket.isGroup) {
                if (ticketTraking.ratingAt == null) {
                    const ratingTxt = ratingMessage || "";
                    let bodyRatingMessage = `\u200e ${ratingTxt}\n`;
                    if (ticket.channel === "whatsapp" && ticket.whatsapp.status === 'CONNECTED') {
                        const msg = await (0, SendWhatsAppMessage_1.default)({ body: bodyRatingMessage, ticket, isForwarded: false });
                        await (0, wbotMessageListener_1.verifyMessage)(msg, ticket, ticket.contact);
                    }
                    else if (["facebook", "instagram"].includes(ticket.channel)) {
                        const msg = await (0, sendFacebookMessage_1.default)({ body: bodyRatingMessage, ticket });
                        await (0, facebookMessageListener_1.verifyMessageFace)(msg, bodyRatingMessage, ticket, ticket.contact);
                    }
                    await ticketTraking.update({
                        userId: ticket.userId,
                        closedAt: (0, moment_1.default)().toDate()
                    });
                    await (0, CreateLogTicketService_1.default)({
                        userId: ticket.userId,
                        queueId: ticket.queueId,
                        ticketId,
                        type: "nps"
                    });
                    await ticket.update({
                        status: "nps",
                        amountUsedBotQueuesNPS: 1
                    });
                    io.of(String(companyId))
                        .emit(`company-${ticket.companyId}-ticket`, {
                        action: "delete",
                        ticketId: ticket.id
                    });
                    console.log(277, "UpdateTicketService");
                    return { ticket, oldStatus, oldUserId };
                }
            }
            if (((!(0, lodash_1.isNil)(user?.farewellMessage) && user?.farewellMessage !== "") ||
                (!(0, lodash_1.isNil)(complationMessage) && complationMessage !== "")) &&
                (sendFarewellMessage || sendFarewellMessage === undefined)) {
                let body;
                if ((ticket.status !== 'pending') || (ticket.status === 'pending' && settings.sendFarewellWaitingTicket === 'enabled')) {
                    if (!(0, lodash_1.isNil)(user) && !(0, lodash_1.isNil)(user?.farewellMessage) && user?.farewellMessage !== "") {
                        body = `\u200e ${user.farewellMessage}`;
                    }
                    else {
                        body = `\u200e ${complationMessage}`;
                    }
                    if (ticket.channel === "whatsapp" && (!ticket.isGroup || groupAsTicket === "enabled") && ticket.whatsapp.status === 'CONNECTED') {
                        const sentMessage = await (0, SendWhatsAppMessage_1.default)({ body, ticket, isForwarded: false });
                        await (0, wbotMessageListener_1.verifyMessage)(sentMessage, ticket, ticket.contact);
                    }
                    if (["facebook", "instagram"].includes(ticket.channel) && (!ticket.isGroup || groupAsTicket === "enabled")) {
                        const sentMessage = await (0, sendFacebookMessage_1.default)({ body, ticket });
                    }
                }
            }
            ticketTraking.finishedAt = (0, moment_1.default)().toDate();
            ticketTraking.closedAt = (0, moment_1.default)().toDate();
            ticketTraking.whatsappId = ticket?.whatsappId;
            ticketTraking.userId = ticket.userId;
            await (0, CreateLogTicketService_1.default)({
                userId,
                queueId: ticket.queueId,
                ticketId,
                type: "closed"
            });
            await ticketTraking.save();
            await ticket.update({
                status: "closed",
                lastFlowId: null,
                dataWebhook: null,
                hashFlowId: null,
            });
            io.of(String(companyId))
                .emit(`company-${ticket.companyId}-ticket`, {
                action: "delete",
                ticketId: ticket.id
            });
            console.log(309, "UpdateTicketService");
            return { ticket, oldStatus, oldUserId };
        }
        let queue;
        if (!(0, lodash_1.isNil)(queueId)) {
            queue = await Queue_1.default.findByPk(queueId);
            ticketTraking.queuedAt = (0, moment_1.default)().toDate();
        }
        if (isTransfered) {
            if (settings.closeTicketOnTransfer) {
                let newTicketTransfer = ticket;
                if (oldQueueId !== queueId) {
                    await ticket.update({
                        status: "closed"
                    });
                    await ticket.reload();
                    io.of(String(companyId))
                        .emit(`company-${ticket.companyId}-ticket`, {
                        action: "delete",
                        ticketId: ticket.id
                    });
                    newTicketTransfer = await (0, FindOrCreateTicketService_1.default)(ticket.contact, ticket.whatsapp, 1, ticket.companyId, queueId, userId, null, ticket.channel, false, false, settings, isTransfered);
                    await (0, FindOrCreateATicketTrakingService_1.default)({ ticketId: newTicketTransfer.id, companyId, whatsappId: ticket.whatsapp.id, userId });
                }
                if (!(0, lodash_1.isNil)(msgTransfer)) {
                    const messageData = {
                        wid: `PVT${newTicketTransfer.updatedAt.toString().replace(' ', '')}`,
                        ticketId: newTicketTransfer.id,
                        contactId: undefined,
                        body: msgTransfer,
                        fromMe: true,
                        mediaType: 'extendedTextMessage',
                        read: true,
                        quotedMsgId: null,
                        ack: 2,
                        remoteJid: newTicketTransfer.contact?.remoteJid,
                        participant: null,
                        dataJson: null,
                        ticketTrakingId: null,
                        isPrivate: true
                    };
                    await (0, CreateMessageService_1.default)({ messageData, companyId: ticket.companyId });
                }
                await newTicketTransfer.update({
                    queueId,
                    userId,
                    status
                });
                await newTicketTransfer.reload();
                if (settings.sendMsgTransfTicket === "enabled") {
                    if ((oldQueueId !== queueId || oldUserId !== userId) && !(0, lodash_1.isNil)(oldQueueId) && !(0, lodash_1.isNil)(queueId) && !(0, lodash_1.isNil)(queueId) && ticket.whatsapp.status === 'CONNECTED') {
                        const wbot = await (0, GetTicketWbot_1.default)(ticket);
                        const msgtxt = (0, Mustache_1.default)(`\u200e ${settings.transferMessage.replace("${queue.name}", queue?.name)}`, ticket);
                        const queueChangedMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                            text: msgtxt
                        });
                        await (0, wbotMessageListener_1.verifyMessage)(queueChangedMessage, ticket, ticket.contact, ticketTraking);
                    }
                }
                if (oldUserId !== userId && oldQueueId === queueId && !(0, lodash_1.isNil)(oldUserId) && !(0, lodash_1.isNil)(userId)) {
                    await (0, CreateLogTicketService_1.default)({
                        userId: oldUserId,
                        queueId: oldQueueId,
                        ticketId,
                        type: "transfered"
                    });
                }
                else if (oldUserId !== userId && oldQueueId === queueId && !(0, lodash_1.isNil)(oldUserId) && !(0, lodash_1.isNil)(userId)) {
                    await (0, CreateLogTicketService_1.default)({
                        userId: oldUserId,
                        queueId: oldQueueId,
                        ticketId,
                        type: "transfered"
                    });
                    await (0, CreateLogTicketService_1.default)({
                        userId,
                        queueId: oldQueueId,
                        ticketId: newTicketTransfer.id,
                        type: "receivedTransfer"
                    });
                }
                else if (oldUserId !== userId && oldQueueId !== queueId && !(0, lodash_1.isNil)(oldUserId) && !(0, lodash_1.isNil)(userId)) {
                    await (0, CreateLogTicketService_1.default)({
                        userId: oldUserId,
                        queueId: oldQueueId,
                        ticketId,
                        type: "transfered"
                    });
                    await (0, CreateLogTicketService_1.default)({
                        userId,
                        queueId,
                        ticketId: newTicketTransfer.id,
                        type: "receivedTransfer"
                    });
                }
                else if (oldUserId !== undefined && (0, lodash_1.isNil)(userId) && oldQueueId !== queueId && !(0, lodash_1.isNil)(queueId)) {
                    await (0, CreateLogTicketService_1.default)({
                        userId: oldUserId,
                        queueId: oldQueueId,
                        ticketId,
                        type: "transfered"
                    });
                }
                if (newTicketTransfer.status !== oldStatus || newTicketTransfer.user?.id !== oldUserId) {
                    await ticketTraking.update({
                        userId: newTicketTransfer.userId
                    });
                    io.of(String(companyId))
                        .emit(`company-${companyId}-ticket`, {
                        action: "delete",
                        ticketId: newTicketTransfer.id
                    });
                }
                io.of(String(companyId))
                    .emit(`company-${companyId}-ticket`, {
                    action: "update",
                    ticket: newTicketTransfer
                });
                return { ticket: newTicketTransfer, oldStatus, oldUserId };
            }
            else {
                if (settings.sendMsgTransfTicket === "enabled") {
                    if (oldQueueId !== queueId || oldUserId !== userId && !(0, lodash_1.isNil)(oldQueueId) && !(0, lodash_1.isNil)(queueId) && ticket.whatsapp.status === 'CONNECTED') {
                        const wbot = await (0, GetTicketWbot_1.default)(ticket);
                        const msgtxt = (0, Mustache_1.default)(`\u200e ${settings.transferMessage.replace("${queue.name}", queue?.name)}`, ticket);
                        const queueChangedMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                            text: msgtxt
                        });
                        await (0, wbotMessageListener_1.verifyMessage)(queueChangedMessage, ticket, ticket.contact, ticketTraking);
                    }
                }
                if (!(0, lodash_1.isNil)(msgTransfer)) {
                    const messageData = {
                        wid: `PVT${ticket.updatedAt.toString().replace(' ', '')}`,
                        ticketId: ticket.id,
                        contactId: undefined,
                        body: msgTransfer,
                        fromMe: true,
                        mediaType: 'extendedTextMessage',
                        read: true,
                        quotedMsgId: null,
                        ack: 2,
                        remoteJid: ticket.contact?.remoteJid,
                        participant: null,
                        dataJson: null,
                        ticketTrakingId: null,
                        isPrivate: true
                    };
                    await (0, CreateMessageService_1.default)({ messageData, companyId: ticket.companyId });
                }
                if (oldUserId !== userId && oldQueueId === queueId && !(0, lodash_1.isNil)(oldUserId) && !(0, lodash_1.isNil)(userId)) {
                    await (0, CreateLogTicketService_1.default)({
                        userId: oldUserId,
                        queueId: oldQueueId,
                        ticketId,
                        type: "transfered"
                    });
                }
                else if (oldUserId !== userId && oldQueueId === queueId && !(0, lodash_1.isNil)(oldUserId) && !(0, lodash_1.isNil)(userId)) {
                    await (0, CreateLogTicketService_1.default)({
                        userId: oldUserId,
                        queueId: oldQueueId,
                        ticketId,
                        type: "transfered"
                    });
                    await (0, CreateLogTicketService_1.default)({
                        userId,
                        queueId: oldQueueId,
                        ticketId: ticket.id,
                        type: "receivedTransfer"
                    });
                }
                else if (oldUserId !== userId && oldQueueId !== queueId && !(0, lodash_1.isNil)(oldUserId) && !(0, lodash_1.isNil)(userId)) {
                    await (0, CreateLogTicketService_1.default)({
                        userId: oldUserId,
                        queueId: oldQueueId,
                        ticketId,
                        type: "transfered"
                    });
                    await (0, CreateLogTicketService_1.default)({
                        userId,
                        queueId,
                        ticketId: ticket.id,
                        type: "receivedTransfer"
                    });
                }
                else if (oldUserId !== undefined && (0, lodash_1.isNil)(userId) && oldQueueId !== queueId && !(0, lodash_1.isNil)(queueId)) {
                    await (0, CreateLogTicketService_1.default)({
                        userId: oldUserId,
                        queueId: oldQueueId,
                        ticketId,
                        type: "transfered"
                    });
                }
            }
        }
        status = queue && queue.closeTicket ? "closed" : status;
        await ticket.update({
            status,
            queueId,
            userId,
            isBot,
            queueOptionId,
            amountUsedBotQueues: status === "closed" ? 0 : amountUsedBotQueues ? amountUsedBotQueues : ticket.amountUsedBotQueues,
            lastMessage: lastMessage ? lastMessage : ticket.lastMessage,
            useIntegration,
            integrationId,
            typebotSessionId: !useIntegration ? null : ticket.typebotSessionId,
            typebotStatus: useIntegration,
            unreadMessages
        });
        ticketTraking.queuedAt = (0, moment_1.default)().toDate();
        ticketTraking.queueId = queueId;
        await ticket.reload();
        if (status === "pending") {
            await (0, CreateLogTicketService_1.default)({
                userId: oldUserId,
                ticketId,
                type: "pending"
            });
            await ticketTraking.update({
                whatsappId: ticket.whatsappId,
                startedAt: null,
                userId: null
            });
        }
        if (status === "open") {
            console.log('a');
            await ticketTraking.update({
                startedAt: (0, moment_1.default)().toDate(),
                ratingAt: null,
                rated: false,
                whatsappId: ticket.whatsappId,
                userId: ticket.userId,
                queueId: ticket.queueId
            });
            await (0, CreateLogTicketService_1.default)({
                userId: userId,
                queueId: ticket.queueId,
                ticketId,
                type: oldStatus === "pending" ? "open" : "reopen"
            });
        }
        await ticketTraking.save();
        if (ticket.status !== oldStatus || ticket.user?.id !== oldUserId || ticket.queueId !== oldQueueId) {
            io.of(String(companyId))
                .emit(`company-${companyId}-ticket`, {
                action: "delete",
                ticketId: ticket.id
            });
        }
        io.of(String(companyId))
            .emit(`company-${companyId}-ticket`, {
            action: "update",
            ticket
        });
        return { ticket, oldStatus, oldUserId };
    }
    catch (err) {
        console.log("erro ao atualizar o ticket", ticketId, "ticketData", ticketData);
        Sentry.captureException(err);
    }
};
exports.default = UpdateTicketService;
//# sourceMappingURL=UpdateTicketService.js.map