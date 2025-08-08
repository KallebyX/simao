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
exports.messageQueue = exports.queueMonitor = exports.campaignQueue = exports.sendScheduledMessages = exports.scheduleMonitor = exports.userMonitor = void 0;
exports.parseToMilliseconds = parseToMilliseconds;
exports.randomValue = randomValue;
exports.startQueueProcess = startQueueProcess;
const Sentry = __importStar(require("@sentry/node"));
const bull_1 = __importDefault(require("bull"));
const SendMessage_1 = require("./helpers/SendMessage");
const Whatsapp_1 = __importDefault(require("./models/Whatsapp"));
const logger_1 = __importDefault(require("./utils/logger"));
const moment_1 = __importDefault(require("moment"));
const Schedule_1 = __importDefault(require("./models/Schedule"));
const sequelize_1 = require("sequelize");
const GetDefaultWhatsApp_1 = __importDefault(require("./helpers/GetDefaultWhatsApp"));
const Campaign_1 = __importDefault(require("./models/Campaign"));
const Queue_1 = __importDefault(require("./models/Queue"));
const ContactList_1 = __importDefault(require("./models/ContactList"));
const ContactListItem_1 = __importDefault(require("./models/ContactListItem"));
const lodash_1 = require("lodash");
const CampaignSetting_1 = __importDefault(require("./models/CampaignSetting"));
const CampaignShipping_1 = __importDefault(require("./models/CampaignShipping"));
const wbot_1 = require("./libs/wbot");
const GetWhatsappWbot_1 = __importDefault(require("./helpers/GetWhatsappWbot"));
const database_1 = __importDefault(require("./database"));
const SendWhatsAppMedia_1 = require("./services/WbotServices/SendWhatsAppMedia");
const socket_1 = require("./libs/socket");
const path_1 = __importDefault(require("path"));
const User_1 = __importDefault(require("./models/User"));
const Company_1 = __importDefault(require("./models/Company"));
const Contact_1 = __importDefault(require("./models/Contact"));
const Queue_2 = __importDefault(require("./models/Queue"));
const wbotClosedTickets_1 = require("./services/WbotServices/wbotClosedTickets");
const Ticket_1 = __importDefault(require("./models/Ticket"));
const ShowContactService_1 = __importDefault(require("./services/ContactServices/ShowContactService"));
const UserQueue_1 = __importDefault(require("./models/UserQueue"));
const ShowTicketService_1 = __importDefault(require("./services/TicketServices/ShowTicketService"));
const SendWhatsAppMessage_1 = __importDefault(require("./services/WbotServices/SendWhatsAppMessage"));
const UpdateTicketService_1 = __importDefault(require("./services/TicketServices/UpdateTicketService"));
const date_fns_1 = require("date-fns");
const GetWhatsapp_1 = require("./helpers/GetWhatsapp");
const CronJob = require('cron').CronJob;
const CompaniesSettings_1 = __importDefault(require("./models/CompaniesSettings"));
const wbotMessageListener_1 = require("./services/WbotServices/wbotMessageListener");
const CreateLogTicketService_1 = __importDefault(require("./services/TicketServices/CreateLogTicketService"));
const Mustache_1 = __importDefault(require("./helpers/Mustache"));
const TicketTag_1 = __importDefault(require("./models/TicketTag"));
const Tag_1 = __importDefault(require("./models/Tag"));
const Plan_1 = __importDefault(require("./models/Plan"));
const connection = process.env.REDIS_URI || "";
const limiterMax = process.env.REDIS_OPT_LIMITER_MAX || 1;
const limiterDuration = process.env.REDIS_OPT_LIMITER_DURATION || 3000;
exports.userMonitor = new bull_1.default("UserMonitor", connection);
exports.scheduleMonitor = new bull_1.default("ScheduleMonitor", connection);
exports.sendScheduledMessages = new bull_1.default("SendSacheduledMessages", connection);
exports.campaignQueue = new bull_1.default("CampaignQueue", connection);
exports.queueMonitor = new bull_1.default("QueueMonitor", connection);
exports.messageQueue = new bull_1.default("MessageQueue", connection, {
    limiter: {
        max: limiterMax,
        duration: limiterDuration
    }
});
let isProcessing = false;
async function handleSendMessage(job) {
    try {
        const { data } = job;
        const whatsapp = await Whatsapp_1.default.findByPk(data.whatsappId);
        if (whatsapp === null) {
            throw Error("Whatsapp não identificado");
        }
        const messageData = data.data;
        await (0, SendMessage_1.SendMessage)(whatsapp, messageData);
    }
    catch (e) {
        Sentry.captureException(e);
        logger_1.default.error("MessageQueue -> SendMessage: error", e.message);
        throw e;
    }
}
async function handleVerifySchedules(job) {
    try {
        logger_1.default.info("SendScheduledMessage -> Verify: iniciando verificação de agendamentos");
        const { count, rows: schedules } = await Schedule_1.default.findAndCountAll({
            where: {
                status: "PENDENTE",
                sentAt: null,
                sendAt: {
                    [sequelize_1.Op.gte]: (0, moment_1.default)().format("YYYY-MM-DD HH:mm:ss"),
                    [sequelize_1.Op.lte]: (0, moment_1.default)().add("30", "seconds").format("YYYY-MM-DD HH:mm:ss")
                }
            },
            include: [{ model: Contact_1.default, as: "contact" }, { model: User_1.default, as: "user", attributes: ["name"] }],
            distinct: true,
            subQuery: false
        });
        logger_1.default.info(`SendScheduledMessage -> Verify: encontrados ${count} agendamentos pendentes`);
        if (count > 0) {
            schedules.map(async (schedule) => {
                try {
                    logger_1.default.info(`SendScheduledMessage -> Verify: processando schedule ID ${schedule.id} para contato ${schedule.contact?.name || 'unknown'}`);
                    await schedule.update({
                        status: "AGENDADA"
                    });
                    exports.sendScheduledMessages.add("SendMessage", { schedule }, { delay: 40000 });
                    logger_1.default.info(`Disparo agendado para: ${schedule.contact?.name || 'unknown'} - Schedule ID: ${schedule.id}`);
                }
                catch (scheduleError) {
                    logger_1.default.error(`SendScheduledMessage -> Verify: erro ao processar schedule ${schedule.id}: ${scheduleError.message}`);
                    Sentry.captureException(scheduleError);
                }
            });
        }
        else {
            logger_1.default.info("SendScheduledMessage -> Verify: nenhum agendamento pendente encontrado");
        }
        logger_1.default.info("SendScheduledMessage -> Verify: verificação concluída com sucesso");
    }
    catch (e) {
        Sentry.captureException(e);
        logger_1.default.error(`SendScheduledMessage -> Verify: error completo - ${e.message}`);
        logger_1.default.error(`SendScheduledMessage -> Verify: stack trace - ${e.stack}`);
        throw e;
    }
}
async function handleSendScheduledMessage(job) {
    const { data: { schedule } } = job;
    let scheduleRecord = null;
    try {
        logger_1.default.debug(`SendScheduledMessage -> SendMessage: iniciando para schedule ID ${schedule.id}`);
        scheduleRecord = await Schedule_1.default.findByPk(schedule.id);
    }
    catch (e) {
        Sentry.captureException(e);
        logger_1.default.error(`Erro ao tentar consultar agendamento: ${schedule.id} - ${e.message}`);
        return;
    }
    try {
        let whatsapp;
        if (!(0, lodash_1.isNil)(schedule.whatsappId)) {
            logger_1.default.debug(`SendScheduledMessage -> SendMessage: buscando WhatsApp ID ${schedule.whatsappId}`);
            whatsapp = await Whatsapp_1.default.findByPk(schedule.whatsappId);
        }
        if (!whatsapp) {
            logger_1.default.debug(`SendScheduledMessage -> SendMessage: WhatsApp não encontrado, buscando padrão para company ${schedule.companyId}`);
            whatsapp = await (0, GetDefaultWhatsApp_1.default)(schedule.companyId);
        }
        if (!whatsapp) {
            logger_1.default.error(`SendScheduledMessage -> SendMessage: Nenhum WhatsApp disponível para company ${schedule.companyId}`);
            throw new Error(`Nenhum WhatsApp disponível para company ${schedule.companyId}`);
        }
        let filePath = null;
        if (schedule.mediaPath) {
            filePath = path_1.default.resolve("public", `company${schedule.companyId}`, schedule.mediaPath);
        }
        if (schedule.openTicket === "enabled") {
            let ticket = await Ticket_1.default.findOne({
                where: {
                    contactId: schedule.contact.id,
                    companyId: schedule.companyId,
                    whatsappId: whatsapp.id,
                    status: ["open", "pending"]
                }
            });
            if (!ticket)
                ticket = await Ticket_1.default.create({
                    companyId: schedule.companyId,
                    contactId: schedule.contactId,
                    whatsappId: whatsapp.id,
                    queueId: schedule.queueId,
                    userId: schedule.ticketUserId,
                    status: schedule.statusTicket
                });
            ticket = await (0, ShowTicketService_1.default)(ticket.id, schedule.companyId);
            let bodyMessage;
            if (schedule.assinar && !(0, lodash_1.isNil)(schedule.userId)) {
                bodyMessage = `*${schedule?.user?.name}:*\n${schedule.body.trim()}`;
            }
            else {
                bodyMessage = schedule.body.trim();
            }
            const sentMessage = await (0, SendMessage_1.SendMessage)(whatsapp, {
                number: schedule.contact.number,
                body: `\u200e ${(0, Mustache_1.default)(bodyMessage, ticket)}`,
                mediaPath: filePath,
                companyId: schedule.companyId
            }, schedule.contact.isGroup);
            if (schedule.mediaPath) {
                await (0, wbotMessageListener_1.verifyMediaMessage)(sentMessage, ticket, ticket.contact, null, true, false, whatsapp);
            }
            else {
                await (0, wbotMessageListener_1.verifyMessage)(sentMessage, ticket, ticket.contact, null, true, false);
            }
        }
        else {
            await (0, SendMessage_1.SendMessage)(whatsapp, {
                number: schedule.contact.number,
                body: `\u200e ${schedule.body}`,
                mediaPath: filePath,
                companyId: schedule.companyId
            }, schedule.contact.isGroup);
        }
        if (schedule.valorIntervalo > 0 && ((0, lodash_1.isNil)(schedule.contadorEnvio) || schedule.contadorEnvio < schedule.enviarQuantasVezes)) {
            let unidadeIntervalo;
            switch (schedule.intervalo) {
                case 1:
                    unidadeIntervalo = 'days';
                    break;
                case 2:
                    unidadeIntervalo = 'weeks';
                    break;
                case 3:
                    unidadeIntervalo = 'months';
                    break;
                case 4:
                    unidadeIntervalo = 'minuts';
                    break;
                default:
                    throw new Error('Intervalo inválido');
            }
            function isDiaUtil(date) {
                const dayOfWeek = date.day();
                return dayOfWeek >= 1 && dayOfWeek <= 5;
            }
            function proximoDiaUtil(date) {
                let proximoDia = date.clone();
                do {
                    proximoDia.add(1, 'day');
                } while (!isDiaUtil(proximoDia));
                return proximoDia;
            }
            function diaUtilAnterior(date) {
                let diaAnterior = date.clone();
                do {
                    diaAnterior.subtract(1, 'day');
                } while (!isDiaUtil(diaAnterior));
                return diaAnterior;
            }
            const dataExistente = new Date(schedule.sendAt);
            const hora = dataExistente.getHours();
            const fusoHorario = dataExistente.getTimezoneOffset();
            let novaData = new Date(dataExistente);
            console.log(unidadeIntervalo);
            if (unidadeIntervalo !== "minuts") {
                novaData.setDate(novaData.getDate() + schedule.valorIntervalo * (unidadeIntervalo === 'days' ? 1 : unidadeIntervalo === 'weeks' ? 7 : 30));
            }
            else {
                novaData.setMinutes(novaData.getMinutes() + Number(schedule.valorIntervalo));
                console.log(novaData);
            }
            if (schedule.tipoDias === 5 && !isDiaUtil(novaData)) {
                novaData = diaUtilAnterior(novaData);
            }
            else if (schedule.tipoDias === 6 && !isDiaUtil(novaData)) {
                novaData = proximoDiaUtil(novaData);
            }
            novaData.setHours(hora);
            novaData.setMinutes(novaData.getMinutes() - fusoHorario);
            await scheduleRecord?.update({
                status: "PENDENTE",
                contadorEnvio: schedule.contadorEnvio + 1,
                sendAt: new Date(novaData.toISOString().slice(0, 19).replace('T', ' '))
            });
        }
        else {
            await scheduleRecord?.update({
                sentAt: new Date((0, moment_1.default)().format("YYYY-MM-DD HH:mm")),
                status: "ENVIADA"
            });
        }
        logger_1.default.info(`Mensagem agendada enviada para: ${schedule.contact.name}`);
        exports.sendScheduledMessages.clean(15000, "completed");
    }
    catch (e) {
        Sentry.captureException(e);
        await scheduleRecord?.update({
            status: "ERRO"
        });
        logger_1.default.error("SendScheduledMessage -> SendMessage: error", e.message);
        throw e;
    }
}
async function handleVerifyCampaigns(job) {
    if (isProcessing) {
        return;
    }
    isProcessing = true;
    try {
        await new Promise(r => setTimeout(r, 1500));
        const campaigns = await database_1.default.query(`SELECT id, "scheduledAt" FROM "Campaigns" c
        WHERE "scheduledAt" BETWEEN NOW() AND NOW() + INTERVAL '3 hour' AND status = 'PROGRAMADA'`, { type: sequelize_1.QueryTypes.SELECT });
        if (campaigns.length > 0) {
            logger_1.default.info(`Campanhas encontradas: ${campaigns.length}`);
            const promises = campaigns.map(async (campaign) => {
                try {
                    await database_1.default.query(`UPDATE "Campaigns" SET status = 'EM_ANDAMENTO' WHERE id = ${campaign.id}`);
                    const now = (0, moment_1.default)();
                    const scheduledAt = (0, moment_1.default)(campaign.scheduledAt);
                    const delay = scheduledAt.diff(now, "milliseconds");
                    logger_1.default.info(`Campanha enviada para a fila de processamento: Campanha=${campaign.id}, Delay Inicial=${delay}`);
                    return exports.campaignQueue.add("ProcessCampaign", { id: campaign.id, delay }, { priority: 3, removeOnComplete: { age: 60 * 60, count: 10 }, removeOnFail: { age: 60 * 60, count: 10 } });
                }
                catch (err) {
                    Sentry.captureException(err);
                }
            });
            await Promise.all(promises);
            logger_1.default.info('Todas as campanhas foram processadas e adicionadas à fila.');
        }
    }
    catch (err) {
        Sentry.captureException(err);
        logger_1.default.error(`Error processing campaigns: ${err.message}`);
    }
    finally {
        isProcessing = false;
    }
}
async function getCampaign(id) {
    return await Campaign_1.default.findOne({
        where: { id },
        include: [
            {
                model: ContactList_1.default,
                as: "contactList",
                attributes: ["id", "name"],
                include: [
                    {
                        model: ContactListItem_1.default,
                        as: "contacts",
                        attributes: ["id", "name", "number", "email", "isWhatsappValid", "isGroup"],
                        where: { isWhatsappValid: true }
                    }
                ]
            },
            {
                model: Whatsapp_1.default,
                as: "whatsapp",
                attributes: ["id", "name"]
            },
        ]
    });
}
async function getContact(id) {
    return await ContactListItem_1.default.findByPk(id, {
        attributes: ["id", "name", "number", "email", "isGroup"]
    });
}
async function getSettings(campaign) {
    try {
        const settings = await CampaignSetting_1.default.findAll({
            where: { companyId: campaign.companyId },
            attributes: ["key", "value"]
        });
        let messageInterval = 20;
        let longerIntervalAfter = 20;
        let greaterInterval = 60;
        let variables = [];
        settings.forEach(setting => {
            if (setting.key === "messageInterval") {
                messageInterval = JSON.parse(setting.value);
            }
            if (setting.key === "longerIntervalAfter") {
                longerIntervalAfter = JSON.parse(setting.value);
            }
            if (setting.key === "greaterInterval") {
                greaterInterval = JSON.parse(setting.value);
            }
            if (setting.key === "variables") {
                variables = JSON.parse(setting.value);
            }
        });
        return {
            messageInterval,
            longerIntervalAfter,
            greaterInterval,
            variables
        };
    }
    catch (error) {
        console.log(error);
        throw error;
    }
}
function parseToMilliseconds(seconds) {
    return seconds * 1000;
}
async function sleep(seconds) {
    logger_1.default.info(`Sleep de ${seconds} segundos iniciado: ${(0, moment_1.default)().format("HH:mm:ss")}`);
    return new Promise(resolve => {
        setTimeout(() => {
            logger_1.default.info(`Sleep de ${seconds} segundos finalizado: ${(0, moment_1.default)().format("HH:mm:ss")}`);
            resolve(true);
        }, parseToMilliseconds(seconds));
    });
}
function getCampaignValidMessages(campaign) {
    const messages = [];
    if (!(0, lodash_1.isEmpty)(campaign.message1) && !(0, lodash_1.isNil)(campaign.message1)) {
        messages.push(campaign.message1);
    }
    if (!(0, lodash_1.isEmpty)(campaign.message2) && !(0, lodash_1.isNil)(campaign.message2)) {
        messages.push(campaign.message2);
    }
    if (!(0, lodash_1.isEmpty)(campaign.message3) && !(0, lodash_1.isNil)(campaign.message3)) {
        messages.push(campaign.message3);
    }
    if (!(0, lodash_1.isEmpty)(campaign.message4) && !(0, lodash_1.isNil)(campaign.message4)) {
        messages.push(campaign.message4);
    }
    if (!(0, lodash_1.isEmpty)(campaign.message5) && !(0, lodash_1.isNil)(campaign.message5)) {
        messages.push(campaign.message5);
    }
    return messages;
}
function getCampaignValidConfirmationMessages(campaign) {
    const messages = [];
    if (!(0, lodash_1.isEmpty)(campaign.confirmationMessage1) &&
        !(0, lodash_1.isNil)(campaign.confirmationMessage1)) {
        messages.push(campaign.confirmationMessage1);
    }
    if (!(0, lodash_1.isEmpty)(campaign.confirmationMessage2) &&
        !(0, lodash_1.isNil)(campaign.confirmationMessage2)) {
        messages.push(campaign.confirmationMessage2);
    }
    if (!(0, lodash_1.isEmpty)(campaign.confirmationMessage3) &&
        !(0, lodash_1.isNil)(campaign.confirmationMessage3)) {
        messages.push(campaign.confirmationMessage3);
    }
    if (!(0, lodash_1.isEmpty)(campaign.confirmationMessage4) &&
        !(0, lodash_1.isNil)(campaign.confirmationMessage4)) {
        messages.push(campaign.confirmationMessage4);
    }
    if (!(0, lodash_1.isEmpty)(campaign.confirmationMessage5) &&
        !(0, lodash_1.isNil)(campaign.confirmationMessage5)) {
        messages.push(campaign.confirmationMessage5);
    }
    return messages;
}
function getProcessedMessage(msg, variables, contact) {
    let finalMessage = msg;
    if (finalMessage.includes("{nome}")) {
        finalMessage = finalMessage.replace(/{nome}/g, contact.name);
    }
    if (finalMessage.includes("{email}")) {
        finalMessage = finalMessage.replace(/{email}/g, contact.email);
    }
    if (finalMessage.includes("{numero}")) {
        finalMessage = finalMessage.replace(/{numero}/g, contact.number);
    }
    if (variables[0]?.value !== '[]') {
        variables.forEach(variable => {
            if (finalMessage.includes(`{${variable.key}}`)) {
                const regex = new RegExp(`{${variable.key}}`, "g");
                finalMessage = finalMessage.replace(regex, variable.value);
            }
        });
    }
    return finalMessage;
}
const checkerWeek = async () => {
    const sab = (0, moment_1.default)().day() === 6;
    const dom = (0, moment_1.default)().day() === 0;
    const sabado = await CampaignSetting_1.default.findOne({
        where: { key: "sabado" }
    });
    const domingo = await CampaignSetting_1.default.findOne({
        where: { key: "domingo" }
    });
    if (sabado?.value === "false" && sab) {
        exports.messageQueue.pause();
        return true;
    }
    if (domingo?.value === "false" && dom) {
        exports.messageQueue.pause();
        return true;
    }
    exports.messageQueue.resume();
    return false;
};
const checkTime = async () => {
    const startHour = await CampaignSetting_1.default.findOne({
        where: {
            key: "startHour"
        }
    });
    const endHour = await CampaignSetting_1.default.findOne({
        where: {
            key: "endHour"
        }
    });
    const hour = startHour.value;
    const endHours = endHour.value;
    const timeNow = (0, moment_1.default)().format("HH:mm");
    if (timeNow <= endHours && timeNow >= hour) {
        exports.messageQueue.resume();
        return true;
    }
    logger_1.default.info(`Envio inicia as ${hour} e termina as ${endHours}, hora atual ${timeNow} não está dentro do horário`);
    exports.messageQueue.clean(0, "delayed");
    exports.messageQueue.clean(0, "wait");
    exports.messageQueue.clean(0, "active");
    exports.messageQueue.clean(0, "completed");
    exports.messageQueue.clean(0, "failed");
    exports.messageQueue.pause();
    return false;
};
function randomValue(min, max) {
    return Math.floor(Math.random() * max) + min;
}
async function verifyAndFinalizeCampaign(campaign) {
    const { companyId, contacts } = campaign.contactList;
    const count1 = contacts.length;
    const count2 = await CampaignShipping_1.default.count({
        where: {
            campaignId: campaign.id,
            deliveredAt: {
                [sequelize_1.Op.ne]: null
            },
            confirmation: campaign.confirmation ? true : { [sequelize_1.Op.or]: [null, false] }
        }
    });
    if (count1 === count2) {
        await campaign.update({ status: "FINALIZADA", completedAt: (0, moment_1.default)() });
    }
    const io = (0, socket_1.getIO)();
    io.of(companyId)
        .emit(`company-${campaign.companyId}-campaign`, {
        action: "update",
        record: campaign
    });
}
async function handleProcessCampaign(job) {
    try {
        const { id } = job.data;
        const campaign = await getCampaign(id);
        const settings = await getSettings(campaign);
        if (campaign) {
            const { contacts } = campaign.contactList;
            if ((0, lodash_1.isArray)(contacts)) {
                const contactData = contacts.map(contact => ({
                    contactId: contact.id,
                    campaignId: campaign.id,
                    variables: settings.variables,
                    isGroup: contact.isGroup
                }));
                const longerIntervalAfter = parseToMilliseconds(settings.longerIntervalAfter);
                const greaterInterval = parseToMilliseconds(settings.greaterInterval);
                const messageInterval = settings.messageInterval;
                let baseDelay = campaign.scheduledAt;
                const queuePromises = [];
                for (let i = 0; i < contactData.length; i++) {
                    baseDelay = (0, date_fns_1.addSeconds)(baseDelay, i > longerIntervalAfter ? greaterInterval : messageInterval);
                    const { contactId, campaignId, variables } = contactData[i];
                    const delay = calculateDelay(i, baseDelay, longerIntervalAfter, greaterInterval, messageInterval);
                    const queuePromise = exports.campaignQueue.add("PrepareContact", { contactId, campaignId, variables, delay }, { removeOnComplete: true });
                    queuePromises.push(queuePromise);
                    logger_1.default.info(`Registro enviado pra fila de disparo: Campanha=${campaign.id};Contato=${contacts[i].name};delay=${delay}`);
                }
                await Promise.all(queuePromises);
            }
        }
    }
    catch (err) {
        Sentry.captureException(err);
    }
}
function calculateDelay(index, baseDelay, longerIntervalAfter, greaterInterval, messageInterval) {
    const diffSeconds = (0, date_fns_1.differenceInSeconds)(baseDelay, new Date());
    if (index > longerIntervalAfter) {
        return diffSeconds * 1000 + greaterInterval;
    }
    else {
        return diffSeconds * 1000 + messageInterval;
    }
}
async function handlePrepareContact(job) {
    try {
        const { contactId, campaignId, delay, variables } = job.data;
        const campaign = await getCampaign(campaignId);
        const contact = await getContact(contactId);
        const campaignShipping = {};
        campaignShipping.number = contact.number;
        campaignShipping.contactId = contactId;
        campaignShipping.campaignId = campaignId;
        const messages = getCampaignValidMessages(campaign);
        if (messages.length >= 0) {
            const radomIndex = randomValue(0, messages.length);
            const message = getProcessedMessage(messages[radomIndex] || "", variables, contact);
            campaignShipping.message = message === null ? "" : `\u200c ${message}`;
        }
        if (campaign.confirmation) {
            const confirmationMessages = getCampaignValidConfirmationMessages(campaign);
            if (confirmationMessages.length) {
                const radomIndex = randomValue(0, confirmationMessages.length);
                const message = getProcessedMessage(confirmationMessages[radomIndex] || "", variables, contact);
                campaignShipping.confirmationMessage = `\u200c ${message}`;
            }
        }
        const [record, created] = await CampaignShipping_1.default.findOrCreate({
            where: {
                campaignId: campaignShipping.campaignId,
                contactId: campaignShipping.contactId
            },
            defaults: campaignShipping
        });
        if (!created &&
            record.deliveredAt === null &&
            record.confirmationRequestedAt === null) {
            record.set(campaignShipping);
            await record.save();
        }
        if (record.deliveredAt === null &&
            record.confirmationRequestedAt === null) {
            const nextJob = await exports.campaignQueue.add("DispatchCampaign", {
                campaignId: campaign.id,
                campaignShippingId: record.id,
                contactListItemId: contactId
            }, {
                delay
            });
            await record.update({ jobId: String(nextJob.id) });
        }
        await verifyAndFinalizeCampaign(campaign);
    }
    catch (err) {
        Sentry.captureException(err);
        logger_1.default.error(`campaignQueue -> PrepareContact -> error: ${err.message}`);
    }
}
async function handleDispatchCampaign(job) {
    try {
        const { data } = job;
        const { campaignShippingId, campaignId } = data;
        const campaign = await getCampaign(campaignId);
        const wbot = await (0, GetWhatsappWbot_1.default)(campaign.whatsapp);
        if (!wbot) {
            logger_1.default.error(`campaignQueue -> DispatchCampaign -> error: wbot not found`);
            return;
        }
        if (!campaign.whatsapp) {
            logger_1.default.error(`campaignQueue -> DispatchCampaign -> error: whatsapp not found`);
            return;
        }
        if (!wbot?.user?.id) {
            logger_1.default.error(`campaignQueue -> DispatchCampaign -> error: wbot user not found`);
            return;
        }
        logger_1.default.info(`Disparo de campanha solicitado: Campanha=${campaignId};Registro=${campaignShippingId}`);
        const campaignShipping = await CampaignShipping_1.default.findByPk(campaignShippingId, {
            include: [{ model: ContactListItem_1.default, as: "contact" }]
        });
        const chatId = campaignShipping.contact.isGroup ? `${campaignShipping.number}@g.us` : `${campaignShipping.number}@s.whatsapp.net`;
        if (campaign.openTicket === "enabled") {
            const [contact] = await Contact_1.default.findOrCreate({
                where: {
                    number: campaignShipping.number,
                    companyId: campaign.companyId
                },
                defaults: {
                    companyId: campaign.companyId,
                    name: campaignShipping.contact.name,
                    number: campaignShipping.number,
                    email: campaignShipping.contact.email,
                    whatsappId: campaign.whatsappId,
                    profilePicUrl: ""
                }
            });
            const whatsapp = await Whatsapp_1.default.findByPk(campaign.whatsappId);
            let ticket = await Ticket_1.default.findOne({
                where: {
                    contactId: contact.id,
                    companyId: campaign.companyId,
                    whatsappId: whatsapp.id,
                    status: ["open", "pending"]
                }
            });
            if (!ticket)
                ticket = await Ticket_1.default.create({
                    companyId: campaign.companyId,
                    contactId: contact.id,
                    whatsappId: whatsapp.id,
                    queueId: campaign?.queueId,
                    userId: campaign?.userId,
                    status: campaign?.statusTicket
                });
            ticket = await (0, ShowTicketService_1.default)(ticket.id, campaign.companyId);
            if (whatsapp.status === "CONNECTED") {
                if (campaign.confirmation && campaignShipping.confirmation === null) {
                    const confirmationMessage = await wbot.sendMessage(chatId, {
                        text: `\u200c ${campaignShipping.confirmationMessage}`
                    });
                    await (0, wbotMessageListener_1.verifyMessage)(confirmationMessage, ticket, contact, null, true, false);
                    await campaignShipping.update({ confirmationRequestedAt: (0, moment_1.default)() });
                }
                else {
                    if (!campaign.mediaPath) {
                        const sentMessage = await wbot.sendMessage(chatId, {
                            text: `\u200c ${campaignShipping.message}`
                        });
                        await (0, wbotMessageListener_1.verifyMessage)(sentMessage, ticket, contact, null, true, false);
                    }
                    if (campaign.mediaPath) {
                        const publicFolder = path_1.default.resolve(__dirname, "..", "public");
                        const filePath = path_1.default.join(publicFolder, `company${campaign.companyId}`, campaign.mediaPath);
                        const options = await (0, SendWhatsAppMedia_1.getMessageOptions)(campaign.mediaName, filePath, String(campaign.companyId), `\u200c ${campaignShipping.message}`);
                        if (Object.keys(options).length) {
                            if (options.mimetype === "audio/mp4") {
                                const audioMessage = await wbot.sendMessage(chatId, {
                                    text: `\u200c ${campaignShipping.message}`
                                });
                                await (0, wbotMessageListener_1.verifyMessage)(audioMessage, ticket, contact, null, true, false);
                            }
                            const sentMessage = await wbot.sendMessage(chatId, { ...options });
                            await (0, wbotMessageListener_1.verifyMediaMessage)(sentMessage, ticket, ticket.contact, null, false, true, wbot);
                        }
                    }
                }
                await campaignShipping.update({ deliveredAt: (0, moment_1.default)() });
            }
        }
        else {
            if (campaign.confirmation && campaignShipping.confirmation === null) {
                await wbot.sendMessage(chatId, {
                    text: campaignShipping.confirmationMessage
                });
                await campaignShipping.update({ confirmationRequestedAt: (0, moment_1.default)() });
            }
            else {
                if (!campaign.mediaPath) {
                    await wbot.sendMessage(chatId, {
                        text: campaignShipping.message
                    });
                }
                if (campaign.mediaPath) {
                    const publicFolder = path_1.default.resolve(__dirname, "..", "public");
                    const filePath = path_1.default.join(publicFolder, `company${campaign.companyId}`, campaign.mediaPath);
                    const options = await (0, SendWhatsAppMedia_1.getMessageOptions)(campaign.mediaName, filePath, String(campaign.companyId), campaignShipping.message);
                    if (Object.keys(options).length) {
                        if (options.mimetype === "audio/mp4") {
                            await wbot.sendMessage(chatId, {
                                text: campaignShipping.message
                            });
                        }
                        await wbot.sendMessage(chatId, { ...options });
                    }
                }
            }
            await campaignShipping.update({ deliveredAt: (0, moment_1.default)() });
        }
        await verifyAndFinalizeCampaign(campaign);
        const io = (0, socket_1.getIO)();
        io.of(String(campaign.companyId))
            .emit(`company-${campaign.companyId}-campaign`, {
            action: "update",
            record: campaign
        });
        logger_1.default.info(`Campanha enviada para: Campanha=${campaignId};Contato=${campaignShipping.contact.name}`);
    }
    catch (err) {
        Sentry.captureException(err);
        logger_1.default.error(err.message);
        console.log(err.stack);
    }
}
async function handleLoginStatus(job) {
    const thresholdTime = new Date();
    thresholdTime.setMinutes(thresholdTime.getMinutes() - 5);
    await User_1.default.update({ online: false }, {
        where: {
            updatedAt: { [sequelize_1.Op.lt]: thresholdTime },
            online: true,
        },
    });
}
async function handleResumeTicketsOutOfHour(job) {
    try {
        const companies = await Company_1.default.findAll({
            attributes: ['id', 'name'],
            where: {
                status: true
            },
            include: [
                {
                    model: Whatsapp_1.default,
                    attributes: ["id", "name", "status", "timeSendQueue", "sendIdQueue"],
                    where: {
                        timeSendQueue: { [sequelize_1.Op.gt]: 0 }
                    }
                },
            ]
        });
        companies.map(async (c) => {
            if (c.whatsapps && Array.isArray(c.whatsapps)) {
                c.whatsapps.map(async (w) => {
                    if (w.status === "CONNECTED") {
                        var companyId = c.id;
                        const moveQueue = w.timeSendQueue ? w.timeSendQueue : 0;
                        const moveQueueId = w.sendIdQueue;
                        const moveQueueTime = moveQueue;
                        const idQueue = moveQueueId;
                        const timeQueue = moveQueueTime;
                        if (moveQueue > 0) {
                            if (!isNaN(idQueue) && Number.isInteger(idQueue) && !isNaN(timeQueue) && Number.isInteger(timeQueue)) {
                                const tempoPassado = (0, moment_1.default)().subtract(timeQueue, "minutes").utc().format();
                                const { count, rows: tickets } = await Ticket_1.default.findAndCountAll({
                                    attributes: ["id"],
                                    where: {
                                        status: "pending",
                                        queueId: null,
                                        companyId: companyId,
                                        whatsappId: w.id,
                                        updatedAt: {
                                            [sequelize_1.Op.lt]: tempoPassado
                                        },
                                    },
                                    include: [
                                        {
                                            model: Contact_1.default,
                                            as: "contact",
                                            attributes: ["id", "name", "number", "email", "profilePicUrl", "acceptAudioMessage", "active", "disableBot", "urlPicture", "lgpdAcceptedAt", "companyId"],
                                            include: ["extraInfo", "tags"]
                                        },
                                        {
                                            model: Queue_2.default,
                                            as: "queue",
                                            attributes: ["id", "name", "color"]
                                        },
                                        {
                                            model: Whatsapp_1.default,
                                            as: "whatsapp",
                                            attributes: ["id", "name", "expiresTicket", "groupAsTicket"]
                                        }
                                    ]
                                });
                                if (count > 0) {
                                    tickets.map(async (ticket) => {
                                        await ticket.update({
                                            queueId: idQueue
                                        });
                                        await ticket.reload();
                                        const io = (0, socket_1.getIO)();
                                        io.of(String(companyId))
                                            .emit(`company-${companyId}-ticket`, {
                                            action: "update",
                                            ticket,
                                            ticketId: ticket.id
                                        });
                                        logger_1.default.info(`Atendimento Perdido: ${ticket.id} - Empresa: ${companyId}`);
                                    });
                                }
                            }
                            else {
                                logger_1.default.info(`Condição não respeitada - Empresa: ${companyId}`);
                            }
                        }
                    }
                });
            }
        });
    }
    catch (e) {
        Sentry.captureException(e);
        logger_1.default.error("SearchForQueue -> VerifyQueue: error", e.message);
        throw e;
    }
}
;
async function handleVerifyQueue(job) {
    try {
        const companies = await Company_1.default.findAll({
            attributes: ['id', 'name'],
            where: {
                status: true
            },
            include: [
                {
                    model: Whatsapp_1.default,
                    attributes: ["id", "name", "status", "timeSendQueue", "sendIdQueue"]
                },
            ]
        });
        companies.map(async (c) => {
            if (c.whatsapps && Array.isArray(c.whatsapps)) {
                c.whatsapps.map(async (w) => {
                    if (w.status === "CONNECTED") {
                        var companyId = c.id;
                        const moveQueue = w.timeSendQueue ? w.timeSendQueue : 0;
                        const moveQueueId = w.sendIdQueue;
                        const moveQueueTime = moveQueue;
                        const idQueue = moveQueueId;
                        const timeQueue = moveQueueTime;
                        if (moveQueue > 0) {
                            if (!isNaN(idQueue) && Number.isInteger(idQueue) && !isNaN(timeQueue) && Number.isInteger(timeQueue)) {
                                const tempoPassado = (0, moment_1.default)().subtract(timeQueue, "minutes").utc().format();
                                const { count, rows: tickets } = await Ticket_1.default.findAndCountAll({
                                    attributes: ["id"],
                                    where: {
                                        status: "pending",
                                        queueId: null,
                                        companyId: companyId,
                                        whatsappId: w.id,
                                        updatedAt: {
                                            [sequelize_1.Op.lt]: tempoPassado
                                        },
                                    },
                                    include: [
                                        {
                                            model: Contact_1.default,
                                            as: "contact",
                                            attributes: ["id", "name", "number", "email", "profilePicUrl", "acceptAudioMessage", "active", "disableBot", "urlPicture", "lgpdAcceptedAt", "companyId"],
                                            include: ["extraInfo", "tags"]
                                        },
                                        {
                                            model: Queue_2.default,
                                            as: "queue",
                                            attributes: ["id", "name", "color"]
                                        },
                                        {
                                            model: Whatsapp_1.default,
                                            as: "whatsapp",
                                            attributes: ["id", "name", "expiresTicket", "groupAsTicket"]
                                        }
                                    ]
                                });
                                if (count > 0) {
                                    tickets.map(async (ticket) => {
                                        await ticket.update({
                                            queueId: idQueue
                                        });
                                        await (0, CreateLogTicketService_1.default)({
                                            userId: null,
                                            queueId: idQueue,
                                            ticketId: ticket.id,
                                            type: "redirect"
                                        });
                                        await ticket.reload();
                                        const io = (0, socket_1.getIO)();
                                        io.of(String(companyId))
                                            .emit(`company-${companyId}-ticket`, {
                                            action: "update",
                                            ticket,
                                            ticketId: ticket.id
                                        });
                                        logger_1.default.info(`Atendimento Perdido: ${ticket.id} - Empresa: ${companyId}`);
                                    });
                                }
                            }
                            else {
                                logger_1.default.info(`Condição não respeitada - Empresa: ${companyId}`);
                            }
                        }
                    }
                });
            }
        });
    }
    catch (e) {
        Sentry.captureException(e);
        logger_1.default.error("SearchForQueue -> VerifyQueue: error", e.message);
        throw e;
    }
}
;
async function handleRandomUser() {
    const jobR = new CronJob('0 */2 * * * *', async () => {
        try {
            const companies = await Company_1.default.findAll({
                attributes: ['id', 'name'],
                where: {
                    status: true
                },
                include: [
                    {
                        model: Queue_1.default,
                        attributes: ["id", "name", "ativarRoteador", "tempoRoteador"],
                        where: {
                            ativarRoteador: true,
                            tempoRoteador: {
                                [sequelize_1.Op.ne]: 0
                            }
                        }
                    },
                ]
            });
            if (companies) {
                companies.map(async (c) => {
                    c.queues.map(async (q) => {
                        const { count, rows: tickets } = await Ticket_1.default.findAndCountAll({
                            where: {
                                companyId: c.id,
                                status: "pending",
                                queueId: q.id,
                            },
                        });
                        const getRandomUserId = (userIds) => {
                            const randomIndex = Math.floor(Math.random() * userIds.length);
                            return userIds[randomIndex];
                        };
                        const findUserById = async (userId, companyId) => {
                            try {
                                const user = await User_1.default.findOne({
                                    where: {
                                        id: userId,
                                        companyId
                                    },
                                });
                                if (user && user?.profile === "user") {
                                    if (user.online === true) {
                                        return user.id;
                                    }
                                    else {
                                        return 0;
                                    }
                                }
                                else {
                                    return 0;
                                }
                            }
                            catch (errorV) {
                                Sentry.captureException(errorV);
                                logger_1.default.error("SearchForUsersRandom -> VerifyUsersRandom: error", errorV.message);
                                throw errorV;
                            }
                        };
                        if (count > 0) {
                            for (const ticket of tickets) {
                                const { queueId, userId } = ticket;
                                const tempoRoteador = q.tempoRoteador;
                                const userQueues = await UserQueue_1.default.findAll({
                                    where: {
                                        queueId: queueId,
                                    },
                                });
                                const contact = await (0, ShowContactService_1.default)(ticket.contactId, ticket.companyId);
                                const userIds = userQueues.map((userQueue) => userQueue.userId);
                                const tempoPassadoB = (0, moment_1.default)().subtract(tempoRoteador, "minutes").utc().toDate();
                                const updatedAtV = new Date(ticket.updatedAt);
                                let settings = await CompaniesSettings_1.default.findOne({
                                    where: {
                                        companyId: ticket.companyId || 0
                                    }
                                });
                                const sendGreetingMessageOneQueues = settings.sendGreetingMessageOneQueues === "enabled" || false;
                                if (!userId) {
                                    const randomUserId = getRandomUserId(userIds);
                                    if (randomUserId !== undefined && await findUserById(randomUserId, ticket.companyId) > 0) {
                                        if (sendGreetingMessageOneQueues) {
                                            const ticketToSend = await (0, ShowTicketService_1.default)(ticket.id, ticket.companyId);
                                            await (0, SendWhatsAppMessage_1.default)({ body: `\u200e *Assistente Virtual*:\nAguarde enquanto localizamos um atendente... Você será atendido em breve!`, ticket: ticketToSend });
                                        }
                                        await (0, UpdateTicketService_1.default)({
                                            ticketData: { status: "pending", userId: randomUserId },
                                            ticketId: ticket.id,
                                            companyId: ticket.companyId,
                                        });
                                        logger_1.default.info(`Ticket ID ${ticket.id} atualizado para UserId ${randomUserId} - ${ticket.updatedAt}`);
                                    }
                                    else {
                                    }
                                }
                                else if (userIds.includes(userId)) {
                                    if (tempoPassadoB > updatedAtV) {
                                        const availableUserIds = userIds.filter((id) => id !== userId);
                                        if (availableUserIds.length > 0) {
                                            const randomUserId = getRandomUserId(availableUserIds);
                                            if (randomUserId !== undefined && await findUserById(randomUserId, ticket.companyId) > 0) {
                                                if (sendGreetingMessageOneQueues) {
                                                    const ticketToSend = await (0, ShowTicketService_1.default)(ticket.id, ticket.companyId);
                                                    await (0, SendWhatsAppMessage_1.default)({ body: "*Assistente Virtual*:\nAguarde enquanto localizamos um atendente... Você será atendido em breve!", ticket: ticketToSend });
                                                }
                                                ;
                                                await (0, UpdateTicketService_1.default)({
                                                    ticketData: { status: "pending", userId: randomUserId },
                                                    ticketId: ticket.id,
                                                    companyId: ticket.companyId,
                                                });
                                                logger_1.default.info(`Ticket ID ${ticket.id} atualizado para UserId ${randomUserId} - ${ticket.updatedAt}`);
                                            }
                                            else {
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    });
                });
            }
        }
        catch (e) {
            Sentry.captureException(e);
            logger_1.default.error("SearchForUsersRandom -> VerifyUsersRandom: error", e.message);
            throw e;
        }
    });
    jobR.start();
}
async function handleProcessLanes() {
    let isProcessingLanes = false;
    const job = new CronJob('*/1 * * * *', async () => {
        if (isProcessingLanes) {
            logger_1.default.warn("Process Lanes -> Previous execution still running, skipping...");
            return;
        }
        isProcessingLanes = true;
        try {
            const companies = await Company_1.default.findAll({
                attributes: ['id', 'name', 'status'],
                include: [
                    {
                        model: Plan_1.default,
                        as: "plan",
                        attributes: ["id", "name", "useKanban"],
                        where: {
                            useKanban: true
                        }
                    },
                ]
            });
            logger_1.default.info(`Process Lanes -> Processing ${companies.length} companies with Kanban enabled`);
            for (const company of companies) {
                try {
                    const companyId = company.get('id') || company.dataValues.id;
                    const companyName = company.get('name') || company.dataValues.name;
                    if (!companyId || typeof companyId !== 'number' || isNaN(companyId)) {
                        logger_1.default.error(`Process Lanes -> Invalid companyId: "${companyId}" for company: ${JSON.stringify(company.dataValues)}`);
                        continue;
                    }
                    logger_1.default.debug(`Process Lanes -> Processing company ${companyId} (${companyName})`);
                    const ticketTags = await TicketTag_1.default.findAll({
                        include: [{
                                model: Ticket_1.default,
                                as: "ticket",
                                where: {
                                    status: "open",
                                    fromMe: true,
                                    companyId: companyId
                                },
                                attributes: ["id", "contactId", "updatedAt", "whatsappId"]
                            }, {
                                model: Tag_1.default,
                                as: "tag",
                                attributes: ["id", "timeLane", "nextLaneId", "greetingMessageLane"],
                                where: {
                                    companyId: companyId
                                }
                            }]
                    });
                    if (ticketTags.length > 0) {
                        ticketTags.map(async (t) => {
                            if (!(0, lodash_1.isNil)(t?.tag.nextLaneId) && t?.tag.nextLaneId > 0 && t?.tag.timeLane > 0) {
                                const nextTag = await Tag_1.default.findByPk(t?.tag.nextLaneId);
                                const dataLimite = new Date();
                                dataLimite.setHours(dataLimite.getHours() - Number(t.tag.timeLane));
                                const dataUltimaInteracaoChamado = new Date(t.ticket.updatedAt);
                                if (dataUltimaInteracaoChamado < dataLimite) {
                                    await TicketTag_1.default.destroy({ where: { ticketId: t.ticketId, tagId: t.tagId } });
                                    await TicketTag_1.default.create({ ticketId: t.ticketId, tagId: nextTag.id });
                                    const whatsapp = await Whatsapp_1.default.findByPk(t.ticket.whatsappId);
                                    if (!(0, lodash_1.isNil)(nextTag.greetingMessageLane) && nextTag.greetingMessageLane !== "") {
                                        const bodyMessage = nextTag.greetingMessageLane;
                                        const contact = await Contact_1.default.findByPk(t.ticket.contactId);
                                        const ticketUpdate = await (0, ShowTicketService_1.default)(t.ticketId, companyId);
                                        await (0, SendMessage_1.SendMessage)(whatsapp, {
                                            number: contact.number,
                                            body: `${(0, Mustache_1.default)(bodyMessage, ticketUpdate)}`,
                                            mediaPath: null,
                                            companyId: companyId
                                        }, contact.isGroup);
                                    }
                                }
                            }
                        });
                    }
                }
                catch (e) {
                    Sentry.captureException(e);
                    logger_1.default.error(`Process Lanes -> Company ${company.id} error: ${e.message}`);
                }
            }
        }
        catch (e) {
            Sentry.captureException(e);
            logger_1.default.error("Process Lanes -> Global error:", e.message);
        }
        finally {
            isProcessingLanes = false;
        }
    });
    job.start();
}
async function handleCloseTicketsAutomatic() {
    let isProcessingCloseTickets = false;
    const job = new CronJob('*/1 * * * *', async () => {
        if (isProcessingCloseTickets) {
            logger_1.default.warn("ClosedAllOpenTickets -> Previous execution still running, skipping...");
            return;
        }
        isProcessingCloseTickets = true;
        try {
            const companies = await Company_1.default.findAll({
                where: {
                    status: true
                },
                attributes: ['id', 'name', 'status']
            });
            logger_1.default.info(`ClosedAllOpenTickets -> Processing ${companies.length} companies`);
            for (const company of companies) {
                try {
                    const companyId = company.get('id') || company.dataValues.id;
                    const companyName = company.get('name') || company.dataValues.name;
                    if (!companyId || typeof companyId !== 'number' || isNaN(companyId)) {
                        logger_1.default.error(`ClosedAllOpenTickets -> Invalid companyId: "${companyId}" for company: ${JSON.stringify(company.dataValues)}`);
                        continue;
                    }
                    logger_1.default.debug(`ClosedAllOpenTickets -> Processing company ${companyId} (${companyName})`);
                    await (0, wbotClosedTickets_1.ClosedAllOpenTickets)(companyId);
                }
                catch (e) {
                    Sentry.captureException(e);
                    logger_1.default.error(`ClosedAllOpenTickets -> Company ${company.id} error: ${e.message}`);
                }
            }
        }
        catch (e) {
            Sentry.captureException(e);
            logger_1.default.error("ClosedAllOpenTickets -> Global error:", e.message);
        }
        finally {
            isProcessingCloseTickets = false;
        }
    });
    job.start();
}
async function handleWhatsapp() {
    const jobW = new CronJob('* 15 3 * * *', async () => {
        (0, GetWhatsapp_1.GetWhatsapp)();
        jobW.stop();
    }, null, false, 'America/Sao_Paulo');
    jobW.start();
}
async function handleInvoiceCreate() {
    logger_1.default.info("GERANDO RECEITA...");
    const job = new CronJob('*/30 * * * * *', async () => {
        const companies = await Company_1.default.findAll();
        companies.map(async (c) => {
            const status = c.status;
            const dueDate = c.dueDate;
            const date = (0, moment_1.default)(dueDate).format();
            const timestamp = (0, moment_1.default)().format();
            const hoje = (0, moment_1.default)().format("DD/MM/yyyy");
            const vencimento = (0, moment_1.default)(dueDate).format("DD/MM/yyyy");
            const diff = (0, moment_1.default)(vencimento, "DD/MM/yyyy").diff((0, moment_1.default)(hoje, "DD/MM/yyyy"));
            const dias = moment_1.default.duration(diff).asDays();
            if (status === true) {
                if (dias <= -3) {
                    logger_1.default.info(`EMPRESA: ${c.id} está VENCIDA A MAIS DE 3 DIAS... INATIVANDO... ${dias}`);
                    c.status = false;
                    await c.save();
                    logger_1.default.info(`EMPRESA: ${c.id} foi INATIVADA.`);
                    logger_1.default.info(`EMPRESA: ${c.id} Desativando conexões com o WhatsApp...`);
                    try {
                        const whatsapps = await Whatsapp_1.default.findAll({
                            where: {
                                companyId: c.id,
                            },
                            attributes: ['id', 'status', 'session'],
                        });
                        for (const whatsapp of whatsapps) {
                            if (whatsapp.session) {
                                await whatsapp.update({ status: "DISCONNECTED", session: "" });
                                const wbot = (0, wbot_1.getWbot)(whatsapp.id);
                                await wbot.logout();
                                logger_1.default.info(`EMPRESA: ${c.id} teve o WhatsApp ${whatsapp.id} desconectado...`);
                            }
                        }
                    }
                    catch (error) {
                        console.error('Erro ao buscar os IDs de WhatsApp:', error);
                        throw error;
                    }
                }
                else {
                    const plan = await Plan_1.default.findByPk(c.planId);
                    const sql = `SELECT * FROM "Invoices" WHERE "companyId" = ${c.id} AND "status" = 'open';`;
                    const openInvoices = await database_1.default.query(sql, { type: sequelize_1.QueryTypes.SELECT });
                    const existingInvoice = openInvoices.find(invoice => (0, moment_1.default)(invoice.dueDate).format("DD/MM/yyyy") === vencimento);
                    if (existingInvoice) {
                    }
                    else if (openInvoices.length > 0) {
                        const updateSql = `UPDATE "Invoices" SET "dueDate" = '${date}' WHERE "id" = ${openInvoices[0].id};`;
                        await database_1.default.query(updateSql, { type: sequelize_1.QueryTypes.UPDATE });
                        logger_1.default.info(`Fatura Atualizada ID: ${openInvoices[0].id}`);
                    }
                    else {
                        const valuePlan = plan.amount.replace(",", ".");
                        const sql = `INSERT INTO "Invoices" ("companyId", "dueDate", detail, status, value, users, connections, queues, "updatedAt", "createdAt")
            VALUES (${c.id}, '${date}', '${plan.name}', 'open', ${valuePlan}, ${plan.users}, ${plan.connections}, ${plan.queues}, '${timestamp}', '${timestamp}');`;
                        const invoiceInsert = await database_1.default.query(sql, { type: sequelize_1.QueryTypes.INSERT });
                        logger_1.default.info(`Fatura Gerada para o cliente: ${c.id}`);
                    }
                }
            }
            else {
            }
        });
    });
    job.start();
}
handleInvoiceCreate();
handleWhatsapp();
handleProcessLanes();
handleCloseTicketsAutomatic();
handleRandomUser();
async function startQueueProcess() {
    logger_1.default.info("Iniciando processamento de filas");
    exports.messageQueue.process("SendMessage", handleSendMessage);
    exports.scheduleMonitor.process("Verify", handleVerifySchedules);
    exports.sendScheduledMessages.process("SendMessage", handleSendScheduledMessage);
    exports.campaignQueue.process("VerifyCampaignsDaatabase", handleVerifyCampaigns);
    exports.campaignQueue.process("ProcessCampaign", handleProcessCampaign);
    exports.campaignQueue.process("PrepareContact", handlePrepareContact);
    exports.campaignQueue.process("DispatchCampaign", handleDispatchCampaign);
    exports.userMonitor.process("VerifyLoginStatus", handleLoginStatus);
    exports.queueMonitor.process("VerifyQueueStatus", handleVerifyQueue);
    exports.scheduleMonitor.add("Verify", {}, {
        repeat: { cron: "0 * * * * *", key: "verify" },
        removeOnComplete: true
    });
    exports.campaignQueue.add("VerifyCampaignsDaatabase", {}, {
        repeat: { cron: "*/20 * * * * *", key: "verify-campaing" },
        removeOnComplete: true
    });
    exports.userMonitor.add("VerifyLoginStatus", {}, {
        repeat: { cron: "* * * * *", key: "verify-login" },
        removeOnComplete: true
    });
    exports.queueMonitor.add("VerifyQueueStatus", {}, {
        repeat: { cron: "0 * * * * *", key: "verify-queue" },
        removeOnComplete: true
    });
}
//# sourceMappingURL=queues.js.map