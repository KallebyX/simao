"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = require("jsonwebtoken");
const AppError_1 = __importDefault(require("../errors/AppError"));
const auth_1 = __importDefault(require("../config/auth"));
const updateUser_1 = require("../helpers/updateUser");
const isAuth = async (req, res, next) => {
    console.log("🔍 [DEBUG] isAuth middleware iniciado");
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log("❌ [DEBUG] Nenhum header de autorização encontrado");
        throw new AppError_1.default("ERR_SESSION_EXPIRED", 401);
    }
    console.log("🔑 [DEBUG] Authorization header:", authHeader.substring(0, 50) + "...");
    const [, token] = authHeader.split(" ");
    if (!token) {
        console.log("❌ [DEBUG] Token não encontrado após split");
        throw new AppError_1.default("ERR_SESSION_EXPIRED", 401);
    }
    console.log("🎫 [DEBUG] Token extraído:", token.substring(0, 20) + "...");
    console.log("🔐 [DEBUG] JWT_SECRET definido:", !!auth_1.default.secret);
    try {
        const decoded = (0, jsonwebtoken_1.verify)(token, auth_1.default.secret);
        console.log("✅ [DEBUG] Token decodificado com sucesso:", JSON.stringify(decoded, null, 2));
        const { id, profile, companyId } = decoded;
        (0, updateUser_1.updateUser)(id, companyId);
        req.user = {
            id,
            profile,
            companyId
        };
        console.log("👤 [DEBUG] Usuário autenticado:", { id, profile, companyId });
    }
    catch (err) {
        console.log("❌ [DEBUG] Erro na verificação do token:", err.message);
        console.log("❌ [DEBUG] Stack do erro:", err.stack);
        if (err.name === "TokenExpiredError") {
            console.log("⏰ [DEBUG] Token expirado");
            throw new AppError_1.default("ERR_SESSION_EXPIRED", 401);
        }
        else if (err.name === "JsonWebTokenError") {
            console.log("🔒 [DEBUG] Token inválido");
            throw new AppError_1.default("ERR_SESSION_EXPIRED", 401);
        }
        else if (err.message === "ERR_SESSION_EXPIRED" && err.statusCode === 401) {
            throw new AppError_1.default(err.message, 401);
        }
        else {
            throw new AppError_1.default("Invalid token. We'll try to assign a new one on next request", 403);
        }
    }
    return next();
};
exports.default = isAuth;
//# sourceMappingURL=isAuth.js.map