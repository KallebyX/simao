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
const Yup = __importStar(require("yup"));
const sequelize_1 = require("sequelize");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const Whatsapp_1 = __importDefault(require("../../models/Whatsapp"));
const ShowWhatsAppService_1 = __importDefault(require("./ShowWhatsAppService"));
const AssociateWhatsappQueue_1 = __importDefault(require("./AssociateWhatsappQueue"));
const UpdateWhatsAppService = async ({ whatsappData, whatsappId, companyId }) => {
    const schema = Yup.object().shape({
        name: Yup.string().min(2),
        status: Yup.string(),
        isDefault: Yup.boolean()
    });
    const { name, status, isDefault, session, greetingMessage, complationMessage, outOfHoursMessage, queueIds = [], token, maxUseBotQueues = 0, timeUseBotQueues = 0, expiresTicket = 0, allowGroup, timeSendQueue = 0, sendIdQueue = null, timeInactiveMessage = 0, inactiveMessage, ratingMessage, maxUseBotQueuesNPS, expiresTicketNPS = 0, whenExpiresTicket, expiresInactiveMessage, groupAsTicket, importOldMessages, importRecentMessages, closedTicketsPostImported, importOldMessagesGroups, timeCreateNewTicket = null, integrationId, schedules, promptId, requestQR = false, collectiveVacationEnd, collectiveVacationMessage, collectiveVacationStart, queueIdImportMessages, flowIdNotPhrase, flowIdWelcome } = whatsappData;
    try {
        await schema.validate({ name, status, isDefault });
    }
    catch (err) {
        throw new AppError_1.default(err.message);
    }
    if (queueIds.length > 1 && !greetingMessage) {
        throw new AppError_1.default("ERR_WAPP_GREETING_REQUIRED");
    }
    let oldDefaultWhatsapp = null;
    if (isDefault) {
        oldDefaultWhatsapp = await Whatsapp_1.default.findOne({
            where: {
                isDefault: true,
                id: { [sequelize_1.Op.not]: whatsappId },
                companyId
            }
        });
        if (oldDefaultWhatsapp) {
            await oldDefaultWhatsapp.update({ isDefault: false });
        }
    }
    const whatsapp = await (0, ShowWhatsAppService_1.default)(whatsappId, companyId);
    await whatsapp.update({
        name,
        status,
        session,
        greetingMessage,
        complationMessage,
        outOfHoursMessage,
        isDefault,
        companyId,
        token,
        maxUseBotQueues: maxUseBotQueues || 0,
        timeUseBotQueues: timeUseBotQueues || 0,
        expiresTicket: expiresTicket || 0,
        allowGroup,
        timeSendQueue,
        sendIdQueue,
        timeInactiveMessage: String(timeInactiveMessage || ''),
        inactiveMessage,
        ratingMessage,
        maxUseBotQueuesNPS,
        expiresTicketNPS,
        whenExpiresTicket,
        expiresInactiveMessage,
        groupAsTicket,
        importOldMessages: importOldMessages ? new Date(importOldMessages) : null,
        importRecentMessages: importRecentMessages ? new Date(importRecentMessages) : null,
        closedTicketsPostImported,
        importOldMessagesGroups,
        timeCreateNewTicket,
        integrationId,
        schedules,
        promptId,
        collectiveVacationEnd,
        collectiveVacationMessage,
        collectiveVacationStart,
        queueIdImportMessages,
        flowIdNotPhrase,
        flowIdWelcome
    });
    if (!requestQR) {
        await (0, AssociateWhatsappQueue_1.default)(whatsapp, queueIds);
    }
    return { whatsapp, oldDefaultWhatsapp };
};
exports.default = UpdateWhatsAppService;
//# sourceMappingURL=UpdateWhatsAppService.js.map