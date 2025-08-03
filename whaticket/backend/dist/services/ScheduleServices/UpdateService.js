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
const AppError_1 = __importDefault(require("../../errors/AppError"));
const ShowService_1 = __importDefault(require("./ShowService"));
const UpdateUserService = async ({ scheduleData, id, companyId }) => {
    const schedule = await (0, ShowService_1.default)(id, companyId);
    if (schedule?.companyId !== companyId) {
        throw new AppError_1.default("Não é possível alterar registros de outra empresa");
    }
    const schema = Yup.object().shape({
        body: Yup.string().min(5)
    });
    const { body, sendAt, sentAt, contactId, ticketId, userId, ticketUserId, queueId, openTicket, statusTicket, whatsappId, intervalo, valorIntervalo, enviarQuantasVezes, tipoDias, assinar } = scheduleData;
    try {
        await schema.validate({ body });
    }
    catch (err) {
        throw new AppError_1.default(err.message);
    }
    await schedule.update({
        body,
        sendAt,
        sentAt,
        contactId,
        ticketId,
        userId,
        ticketUserId,
        queueId,
        openTicket,
        statusTicket,
        whatsappId,
        intervalo,
        valorIntervalo,
        enviarQuantasVezes,
        tipoDias,
        assinar
    });
    await schedule.reload();
    return schedule;
};
exports.default = UpdateUserService;
//# sourceMappingURL=UpdateService.js.map