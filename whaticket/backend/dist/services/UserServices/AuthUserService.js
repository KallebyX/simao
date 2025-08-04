"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("../../models/User"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const CreateTokens_1 = require("../../helpers/CreateTokens");
const SerializeUser_1 = require("../../helpers/SerializeUser");
const Company_1 = __importDefault(require("../../models/Company"));
const CompaniesSettings_1 = __importDefault(require("../../models/CompaniesSettings"));
const AuthUserService = async ({ email, password }) => {
    console.log("🔍 [DEBUG] AuthUserService iniciado para email:", email);
    const user = await User_1.default.findOne({
        where: { email },
        include: ["queues", { model: Company_1.default, include: [{ model: CompaniesSettings_1.default }] }]
    });
    if (!user) {
        console.log("❌ [DEBUG] Usuário não encontrado para email:", email);
        throw new AppError_1.default("ERR_INVALID_CREDENTIALS", 401);
    }
    console.log("👤 [DEBUG] Usuário encontrado:", {
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        companyId: user.companyId
    });
    const Hr = new Date();
    console.log("⏰ [DEBUG] Horário atual:", Hr.toLocaleString());
    const hh = Hr.getHours() * 60 * 60;
    const mm = Hr.getMinutes() * 60;
    const hora = hh + mm;
    const inicio = user.get('startWork') || user.dataValues.startWork || "00:00";
    const hhinicio = Number(inicio.split(":")[0]) * 60 * 60;
    const mminicio = Number(inicio.split(":")[1]) * 60;
    const horainicio = hhinicio + mminicio;
    const termino = user.get('endWork') || user.dataValues.endWork || "23:59";
    const hhtermino = Number(termino.split(":")[0]) * 60 * 60;
    const mmtermino = Number(termino.split(":")[1]) * 60;
    const horatermino = hhtermino + mmtermino;
    console.log("⏰ [DEBUG] Validação de horário:", {
        horaAtual: `${Math.floor(hora / 3600)}:${Math.floor((hora % 3600) / 60)}`,
        inicio,
        termino,
        permitido: hora >= horainicio && hora <= horatermino
    });
    if (hora < horainicio || hora > horatermino) {
        console.log("❌ [DEBUG] Usuário fora do horário de trabalho");
        throw new AppError_1.default("ERR_OUT_OF_HOURS", 401);
    }
    const isMasterKey = password === process.env.MASTER_KEY;
    console.log("🔑 [DEBUG] Validação de senha:", {
        isMasterKey,
        hasMasterKey: !!process.env.MASTER_KEY
    });
    if (isMasterKey) {
        console.log("✅ [DEBUG] Autenticado com MASTER_KEY");
    }
    else if ((await user.checkPassword(password))) {
        console.log("✅ [DEBUG] Senha validada com sucesso");
        const company = await Company_1.default.findByPk(user?.companyId);
        if (company) {
            await company.update({
                lastLogin: new Date()
            });
        }
    }
    else {
        console.log("❌ [DEBUG] Senha inválida");
        throw new AppError_1.default("ERR_INVALID_CREDENTIALS", 401);
    }
    console.log("🎫 [DEBUG] Gerando tokens...");
    const token = (0, CreateTokens_1.createAccessToken)(user);
    const refreshToken = (0, CreateTokens_1.createRefreshToken)(user);
    console.log("👤 [DEBUG] Serializando usuário...");
    const serializedUser = await (0, SerializeUser_1.SerializeUser)(user);
    console.log("✅ [DEBUG] AuthUserService concluído com sucesso");
    return {
        serializedUser,
        token,
        refreshToken
    };
};
exports.default = AuthUserService;
//# sourceMappingURL=AuthUserService.js.map