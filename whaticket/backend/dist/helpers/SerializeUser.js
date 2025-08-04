"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerializeUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const SerializeUser = async (user) => {
    const generateToken = (userId) => {
        const token = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
        return token;
    };
    return {
        id: user.get('id') || user.dataValues.id || user.id,
        name: user.get('name') || user.dataValues.name || user.name,
        email: user.get('email') || user.dataValues.email || user.email,
        profile: user.get('profile') || user.dataValues.profile || user.profile,
        companyId: user.get('companyId') || user.dataValues.companyId || user.companyId,
        company: user.company,
        super: user.get('super') || user.dataValues.super || user.super,
        queues: user.queues,
        startWork: user.get('startWork') || user.dataValues.startWork || user.startWork || "00:00",
        endWork: user.get('endWork') || user.dataValues.endWork || user.endWork || "23:59",
        allTicket: user.get('allTicket') || user.dataValues.allTicket || user.allTicket,
        whatsappId: user.get('whatsappId') || user.dataValues.whatsappId || user.whatsappId,
        profileImage: user.get('profileImage') || user.dataValues.profileImage || user.profileImage,
        defaultTheme: user.get('defaultTheme') || user.dataValues.defaultTheme || user.defaultTheme,
        defaultMenu: user.get('defaultMenu') || user.dataValues.defaultMenu || user.defaultMenu,
        allHistoric: user.get('allHistoric') || user.dataValues.allHistoric || user.allHistoric,
        allUserChat: user.get('allUserChat') || user.dataValues.allUserChat || user.allUserChat,
        defaultTicketsManagerWidth: user.get('defaultTicketsManagerWidth') || user.dataValues.defaultTicketsManagerWidth || user.defaultTicketsManagerWidth,
        userClosePendingTicket: user.get('userClosePendingTicket') || user.dataValues.userClosePendingTicket || user.userClosePendingTicket,
        showDashboard: user.get('showDashboard') || user.dataValues.showDashboard || user.showDashboard,
        token: generateToken(user.get('id') || user.dataValues.id || user.id),
        allowGroup: user.get('allowGroup') || user.dataValues.allowGroup || user.allowGroup,
        allowRealTime: user.get('allowRealTime') || user.dataValues.allowRealTime || user.allowRealTime,
        allowConnections: user.get('allowConnections') || user.dataValues.allowConnections || user.allowConnections
    };
};
exports.SerializeUser = SerializeUser;
//# sourceMappingURL=SerializeUser.js.map