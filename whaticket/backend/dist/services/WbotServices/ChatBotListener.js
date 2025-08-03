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
exports.sayChatbot = exports.deleteAndCreateDialogStage = void 0;
const path_1 = __importDefault(require("path"));
const wbotMessageListener_1 = require("./wbotMessageListener");
const ShowDialogChatBotsServices_1 = __importDefault(require("../DialogChatBotsServices/ShowDialogChatBotsServices"));
const ShowQueueService_1 = __importDefault(require("../QueueService/ShowQueueService"));
const ShowChatBotServices_1 = __importDefault(require("../ChatBotServices/ShowChatBotServices"));
const DeleteDialogChatBotsServices_1 = __importDefault(require("../DialogChatBotsServices/DeleteDialogChatBotsServices"));
const ShowChatBotByChatbotIdServices_1 = __importDefault(require("../ChatBotServices/ShowChatBotByChatbotIdServices"));
const CreateDialogChatBotsServices_1 = __importDefault(require("../DialogChatBotsServices/CreateDialogChatBotsServices"));
const ShowWhatsAppService_1 = __importDefault(require("../WhatsappService/ShowWhatsAppService"));
const Mustache_1 = __importDefault(require("../../helpers/Mustache"));
const UpdateTicketService_1 = __importDefault(require("../TicketServices/UpdateTicketService"));
const ShowService_1 = __importDefault(require("../FileServices/ShowService"));
const SendWhatsAppMedia_1 = __importStar(require("./SendWhatsAppMedia"));
const CompaniesSettings_1 = __importDefault(require("../../models/CompaniesSettings"));
const fs = require('fs');
var axios = require('axios');
const isNumeric = (value) => /^-?\d+$/.test(value);
const deleteAndCreateDialogStage = async (contact, chatbotId, ticket) => {
    try {
        await (0, DeleteDialogChatBotsServices_1.default)(contact.id);
        const bots = await (0, ShowChatBotByChatbotIdServices_1.default)(chatbotId);
        if (!bots) {
            await ticket.update({ isBot: false });
        }
        return await (0, CreateDialogChatBotsServices_1.default)({
            awaiting: 1,
            contactId: contact.id,
            chatbotId,
            queueId: bots.queueId
        });
    }
    catch (error) {
        await ticket.update({ isBot: false });
    }
};
exports.deleteAndCreateDialogStage = deleteAndCreateDialogStage;
const sendMessage = async (wbot, contact, ticket, body) => {
    const sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
        text: (0, Mustache_1.default)(body, ticket)
    });
    await (0, wbotMessageListener_1.verifyMessage)(sentMessage, ticket, contact);
};
const sendMessageLink = async (wbot, contact, ticket, url, caption) => {
    let sentMessage;
    try {
        sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
            document: url ? { url } : fs.readFileSync(`public/temp/${caption}-${makeid(10)}`),
            fileName: caption,
            mimetype: 'application/pdf'
        });
    }
    catch (error) {
        sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
            text: (0, Mustache_1.default)('\u200eNão consegui enviar o PDF, tente novamente!', ticket)
        });
    }
    await (0, wbotMessageListener_1.verifyMessage)(sentMessage, ticket, contact);
};
const sendMessageImage = async (wbot, contact, ticket, url, caption) => {
    let sentMessage;
    try {
        sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
            image: url ? { url } : fs.readFileSync(`public/temp/${caption}-${makeid(10)}`),
            fileName: caption,
            caption: caption,
            mimetype: 'image/jpeg'
        });
    }
    catch (error) {
        sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
            text: (0, Mustache_1.default)('Não consegui enviar o PDF, tente novamente!', ticket)
        });
    }
    await (0, wbotMessageListener_1.verifyMessage)(sentMessage, ticket, contact);
};
const sendDialog = async (choosenQueue, wbot, contact, ticket) => {
    const showChatBots = await (0, ShowChatBotServices_1.default)(choosenQueue.id);
    if (showChatBots.options) {
        let companyId = ticket.companyId;
        const buttonActive = await CompaniesSettings_1.default.findOne({
            where: { companyId }
        });
        const typeBot = buttonActive?.chatBotType || "text";
        const botText = async () => {
            let options = "";
            showChatBots.options.forEach((option, index) => {
                options += `*[ ${index + 1} ]* - ${option.name}\n`;
            });
            const optionsBack = options.length > 0
                ? `${options}\n*[ # ]* Voltar para o menu principal\n*[ Sair ]* Encerrar atendimento`
                : `${options}\n*[ Sair ]* Encerrar atendimento`;
            if (options.length > 0) {
                const body = (0, Mustache_1.default)(`\u200e ${choosenQueue.greetingMessage}\n\n${optionsBack}`, ticket);
                const sendOption = await sendMessage(wbot, contact, ticket, body);
                return sendOption;
            }
            const body = (0, Mustache_1.default)(`\u200e ${choosenQueue.greetingMessage}`, ticket);
            const send = await sendMessage(wbot, contact, ticket, body);
            return send;
        };
        const botButton = async () => {
            const buttons = [];
            showChatBots.options.forEach((option, index) => {
                buttons.push({
                    buttonId: `${index + 1}`,
                    buttonText: { displayText: option.name },
                    type: 1
                });
            });
            if (buttons.length > 0) {
                const buttonMessage = {
                    text: `\u200e${choosenQueue.greetingMessage}`,
                    buttons,
                    headerType: 1
                };
                const send = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, buttonMessage);
                await (0, wbotMessageListener_1.verifyMessage)(send, ticket, contact);
                return send;
            }
            const body = `\u200e${choosenQueue.greetingMessage}`;
            const send = await sendMessage(wbot, contact, ticket, body);
            return send;
        };
        const botList = async () => {
            const sectionsRows = [];
            showChatBots.options.forEach((queue, index) => {
                sectionsRows.push({
                    title: queue.name,
                    rowId: `${index + 1}`
                });
            });
            if (sectionsRows.length > 0) {
                const sections = [
                    {
                        title: "Menu",
                        rows: sectionsRows
                    }
                ];
                const listMessage = {
                    text: (0, Mustache_1.default)(`\u200e${choosenQueue.greetingMessage}`, ticket),
                    buttonText: "Escolha uma opção",
                    sections
                };
                const sendMsg = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, listMessage);
                await (0, wbotMessageListener_1.verifyMessage)(sendMsg, ticket, contact);
                return sendMsg;
            }
            const body = `\u200e${choosenQueue.greetingMessage}`;
            const send = await sendMessage(wbot, contact, ticket, body);
            return send;
        };
        if (typeBot === "text") {
            return await botText();
        }
        if (typeBot === "button" && showChatBots.options.length > 4) {
            return await botText();
        }
        if (typeBot === "button" && showChatBots.options.length <= 4) {
            return await botButton();
        }
        if (typeBot === "list") {
            return await botList();
        }
    }
};
const backToMainMenu = async (wbot, contact, ticket, ticketTraking) => {
    await (0, UpdateTicketService_1.default)({
        ticketData: { queueId: null, userId: null },
        ticketId: ticket.id,
        companyId: ticket.companyId
    });
    const { queues, greetingMessage, greetingMediaAttachment } = await (0, ShowWhatsAppService_1.default)(wbot.id, ticket.companyId);
    const buttonActive = await CompaniesSettings_1.default.findOne({
        where: {
            companyId: ticket.companyId
        }
    });
    const botText = async () => {
        let options = "";
        queues.forEach((option, index) => {
            options += `*[ ${index + 1} ]* - ${option.name}\n`;
        });
        options += `\n*[ Sair ]* - Encerrar Atendimento`;
        const body = (0, Mustache_1.default)(`\u200e ${greetingMessage}\n\n${options}`, ticket);
        if (greetingMediaAttachment !== null) {
            const filePath = path_1.default.resolve("public", `company${ticket.companyId}`, ticket.whatsapp.greetingMediaAttachment);
            const messagePath = ticket.whatsapp.greetingMediaAttachment;
            const optionsMsg = await (0, SendWhatsAppMedia_1.getMessageOptions)(messagePath, filePath, String(ticket.companyId), body);
            const sentMessage = await wbot.sendMessage(`${ticket.contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, { ...optionsMsg });
            await (0, wbotMessageListener_1.verifyMediaMessage)(sentMessage, ticket, contact, ticketTraking, false, false, wbot);
        }
        else {
            const sentMessage = await wbot.sendMessage(`${contact.number}@${ticket.isGroup ? "g.us" : "s.whatsapp.net"}`, {
                text: body
            });
            await (0, wbotMessageListener_1.verifyMessage)(sentMessage, ticket, contact);
        }
        const deleteDialog = await (0, DeleteDialogChatBotsServices_1.default)(contact.id);
        return deleteDialog;
    };
    if (buttonActive.chatBotType === "text") {
        return botText();
    }
};
function validaCpfCnpj(val) {
    if (val.length == 11) {
        var cpf = val.trim();
        cpf = cpf.replace(/\./g, '');
        cpf = cpf.replace('-', '');
        cpf = cpf.split('');
        var v1 = 0;
        var v2 = 0;
        var aux = false;
        for (var i = 1; cpf.length > i; i++) {
            if (cpf[i - 1] != cpf[i]) {
                aux = true;
            }
        }
        if (aux == false) {
            return false;
        }
        for (var i = 0, p = 10; (cpf.length - 2) > i; i++, p--) {
            v1 += cpf[i] * p;
        }
        v1 = ((v1 * 10) % 11);
        if (v1 == 10) {
            v1 = 0;
        }
        if (v1 != cpf[9]) {
            return false;
        }
        for (var i = 0, p = 11; (cpf.length - 1) > i; i++, p--) {
            v2 += cpf[i] * p;
        }
        v2 = ((v2 * 10) % 11);
        if (v2 == 10) {
            v2 = 0;
        }
        if (v2 != cpf[10]) {
            return false;
        }
        else {
            return true;
        }
    }
    else if (val.length == 14) {
        var cnpj = val.trim();
        cnpj = cnpj.replace(/\./g, '');
        cnpj = cnpj.replace('-', '');
        cnpj = cnpj.replace('/', '');
        cnpj = cnpj.split('');
        var v1 = 0;
        var v2 = 0;
        var aux = false;
        for (var i = 1; cnpj.length > i; i++) {
            if (cnpj[i - 1] != cnpj[i]) {
                aux = true;
            }
        }
        if (aux == false) {
            return false;
        }
        for (var i = 0, p1 = 5, p2 = 13; (cnpj.length - 2) > i; i++, p1--, p2--) {
            if (p1 >= 2) {
                v1 += cnpj[i] * p1;
            }
            else {
                v1 += cnpj[i] * p2;
            }
        }
        v1 = (v1 % 11);
        if (v1 < 2) {
            v1 = 0;
        }
        else {
            v1 = (11 - v1);
        }
        if (v1 != cnpj[12]) {
            return false;
        }
        for (var i = 0, p1 = 6, p2 = 14; (cnpj.length - 1) > i; i++, p1--, p2--) {
            if (p1 >= 2) {
                v2 += cnpj[i] * p1;
            }
            else {
                v2 += cnpj[i] * p2;
            }
        }
        v2 = (v2 % 11);
        if (v2 < 2) {
            v2 = 0;
        }
        else {
            v2 = (11 - v2);
        }
        if (v2 != cnpj[13]) {
            return false;
        }
        else {
            return true;
        }
    }
    else {
        return false;
    }
}
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function sleep(time) {
    await timeout(time);
}
function firstDayOfMonth(month) {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - month, 1);
    return firstDay;
}
;
function lastDayOfMonth(month) {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + month, 0);
    return lastDay;
}
;
function dataAtualFormatada(data) {
    var dia = data.getDate().toString(), diaF = (dia.length == 1) ? '0' + dia : dia, mes = (data.getMonth() + 1).toString(), mesF = (mes.length == 1) ? '0' + mes : mes, anoF = data.getFullYear();
    return diaF + "/" + mesF + "/" + anoF;
}
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}
function formatDate(date) {
    return date.substring(8, 10) + '/' + date.substring(5, 7) + '/' + date.substring(0, 4);
}
function sortfunction(a, b) {
    return a.dueDate.localeCompare(b.dueDate);
}
async function sendMsgAndCloseTicket(wbot, contact, ticket) {
    const ticketUpdateAgent = {
        ticketData: {
            status: "closed",
            userId: ticket?.userId || null,
            sendFarewellMessage: false,
            amountUsedBotQueues: 0
        },
        ticketId: ticket.id,
        companyId: ticket.companyId,
    };
    await sleep(2000);
    await (0, UpdateTicketService_1.default)(ticketUpdateAgent);
}
const sayChatbot = async (queueId, wbot, ticket, contact, msg, ticketTraking) => {
    const selectedOption = msg?.message?.buttonsResponseMessage?.selectedButtonId ||
        msg?.message?.listResponseMessage?.singleSelectReply.selectedRowId ||
        (0, wbotMessageListener_1.getBodyMessage)(msg);
    if (!queueId && selectedOption && msg.key.fromMe)
        return;
    const getStageBot = await (0, ShowDialogChatBotsServices_1.default)(contact.id);
    if (String(selectedOption).toLocaleLowerCase() === "sair") {
        const ticketUpdateAgent = {
            ticketData: {
                status: "closed",
                sendFarewellMessage: true,
                amountUsedBotQueues: 0
            },
            ticketId: ticket.id,
            companyId: ticket.companyId
        };
        await (0, UpdateTicketService_1.default)(ticketUpdateAgent);
        return;
    }
    if (selectedOption === "#") {
        const backTo = await backToMainMenu(wbot, contact, ticket, ticketTraking);
        return;
    }
    if (!getStageBot) {
        const queue = await (0, ShowQueueService_1.default)(queueId, ticket.companyId);
        const selectedOptions = msg?.message?.buttonsResponseMessage?.selectedButtonId ||
            msg?.message?.listResponseMessage?.singleSelectReply.selectedRowId ||
            (0, wbotMessageListener_1.getBodyMessage)(msg);
        const choosenQueue = queue.chatbots[+selectedOptions - 1];
        if (choosenQueue) {
            if (choosenQueue.queueType === "integration") {
                try {
                    await ticket.update({
                        integrationId: choosenQueue.optIntegrationId,
                        useIntegration: true,
                        status: "pending",
                        queueId: null
                    });
                }
                catch (error) {
                    await (0, exports.deleteAndCreateDialogStage)(contact, choosenQueue.id, ticket);
                }
            }
            else if (choosenQueue.queueType === "queue") {
                try {
                    const ticketUpdateAgent = {
                        ticketData: {
                            queueId: choosenQueue.optQueueId,
                            status: "pending"
                        },
                        ticketId: ticket.id
                    };
                    await (0, UpdateTicketService_1.default)({
                        ticketData: {
                            ...ticketUpdateAgent.ticketData,
                        },
                        ticketId: ticketUpdateAgent.ticketId,
                        companyId: ticket.companyId
                    });
                }
                catch (error) {
                    await (0, exports.deleteAndCreateDialogStage)(contact, choosenQueue.id, ticket);
                }
            }
            else if (choosenQueue.queueType === "attendent") {
                try {
                    const ticketUpdateAgent = {
                        ticketData: {
                            queueId: choosenQueue.optQueueId,
                            userId: choosenQueue.optUserId,
                            status: "pending"
                        },
                        ticketId: ticket.id
                    };
                    await (0, UpdateTicketService_1.default)({
                        ticketData: {
                            ...ticketUpdateAgent.ticketData,
                        },
                        ticketId: ticketUpdateAgent.ticketId,
                        companyId: ticket.companyId
                    });
                }
                catch (error) {
                    await (0, exports.deleteAndCreateDialogStage)(contact, choosenQueue.id, ticket);
                }
            }
            await (0, exports.deleteAndCreateDialogStage)(contact, choosenQueue.id, ticket);
            let send;
            if (choosenQueue?.greetingMessage && (!choosenQueue.optIntegrationId || ticket.typebotSessionTime === null)) {
                send = await sendDialog(choosenQueue, wbot, contact, ticket);
            }
            if (choosenQueue.queueType === "file") {
                try {
                    const publicFolder = path_1.default.resolve(__dirname, "..", "..", "..", "public");
                    const files = await (0, ShowService_1.default)(choosenQueue.optFileId, ticket.companyId);
                    const folder = path_1.default.resolve(publicFolder, `company${ticket.companyId}`, "fileList", String(files.id));
                    for (const [index, file] of files.options.entries()) {
                        const mediaSrc = {
                            fieldname: 'medias',
                            originalname: file.path,
                            encoding: '7bit',
                            mimetype: file.mediaType,
                            filename: file.path,
                            path: path_1.default.resolve(folder, file.path),
                        };
                        await (0, SendWhatsAppMedia_1.default)({ media: mediaSrc, ticket, body: file.name, isForwarded: false });
                    }
                    ;
                }
                catch (error) {
                    await (0, exports.deleteAndCreateDialogStage)(contact, choosenQueue.id, ticket);
                }
            }
            if (choosenQueue.closeTicket) {
                await sendMsgAndCloseTicket(wbot, ticket.contact, ticket);
            }
            return send;
        }
    }
    if (getStageBot) {
        const selected = isNumeric(selectedOption) ? selectedOption : 1;
        const bots = await (0, ShowChatBotServices_1.default)(getStageBot.chatbotId);
        const choosenQueue = bots.options[+selected - 1]
            ? bots.options[+selected - 1]
            : bots.options[0];
        if (!choosenQueue.greetingMessage) {
            await (0, DeleteDialogChatBotsServices_1.default)(contact.id);
            return;
        }
        if (choosenQueue) {
            if (choosenQueue.queueType === "integration") {
                try {
                    const ticketUpdateAgent = {
                        ticketData: {
                            integrationId: choosenQueue.optIntegrationId,
                            useIntegration: true,
                            status: "pending"
                        },
                        ticketId: ticket.id
                    };
                    await (0, UpdateTicketService_1.default)({
                        ticketData: {
                            ...ticketUpdateAgent.ticketData,
                        },
                        ticketId: ticketUpdateAgent.ticketId,
                        companyId: ticket.companyId
                    });
                }
                catch (error) {
                    await (0, exports.deleteAndCreateDialogStage)(contact, choosenQueue.id, ticket);
                }
            }
            else if (choosenQueue.queueType === "queue") {
                try {
                    const ticketUpdateAgent = {
                        ticketData: {
                            queueId: choosenQueue.optQueueId,
                            status: "pending"
                        },
                        ticketId: ticket.id
                    };
                    await (0, UpdateTicketService_1.default)({
                        ticketData: {
                            ...ticketUpdateAgent.ticketData,
                        },
                        ticketId: ticketUpdateAgent.ticketId,
                        companyId: ticket.companyId
                    });
                }
                catch (error) {
                    await (0, exports.deleteAndCreateDialogStage)(contact, choosenQueue.id, ticket);
                }
            }
            else if (choosenQueue.queueType === "attendent") {
                try {
                    const ticketUpdateAgent = {
                        ticketData: {
                            queueId: choosenQueue.optQueueId,
                            userId: choosenQueue.optUserId,
                            status: "pending"
                        },
                        ticketId: ticket.id
                    };
                    await (0, UpdateTicketService_1.default)({
                        ticketData: {
                            ...ticketUpdateAgent.ticketData,
                        },
                        ticketId: ticketUpdateAgent.ticketId,
                        companyId: ticket.companyId
                    });
                }
                catch (error) {
                    await (0, exports.deleteAndCreateDialogStage)(contact, choosenQueue.id, ticket);
                }
            }
            await (0, exports.deleteAndCreateDialogStage)(contact, choosenQueue.id, ticket);
            if (choosenQueue.queueType === "file") {
                try {
                    const publicFolder = path_1.default.resolve(__dirname, "..", "..", "..", "public");
                    const files = await (0, ShowService_1.default)(choosenQueue.optFileId, ticket.companyId);
                    const folder = path_1.default.resolve(publicFolder, `company${ticket.companyId}`, "fileList", String(files.id));
                    for (const [index, file] of files.options.entries()) {
                        const mediaSrc = {
                            fieldname: 'medias',
                            originalname: file.path,
                            encoding: '7bit',
                            mimetype: file.mediaType,
                            filename: file.path,
                            path: path_1.default.resolve(folder, file.path),
                        };
                        await (0, SendWhatsAppMedia_1.default)({ media: mediaSrc, ticket, body: file.name, isForwarded: false });
                    }
                    ;
                }
                catch (error) {
                    await (0, exports.deleteAndCreateDialogStage)(contact, choosenQueue.id, ticket);
                }
            }
            if (choosenQueue.closeTicket) {
                await sendMsgAndCloseTicket(wbot, ticket.contact, ticket);
            }
            await (0, exports.deleteAndCreateDialogStage)(contact, choosenQueue.id, ticket);
            const send = await sendDialog(choosenQueue, wbot, contact, ticket);
            return send;
        }
    }
};
exports.sayChatbot = sayChatbot;
//# sourceMappingURL=ChatBotListener.js.map