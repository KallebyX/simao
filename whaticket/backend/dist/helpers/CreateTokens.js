"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRefreshToken = exports.createAccessToken = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const auth_1 = __importDefault(require("../config/auth"));
const createAccessToken = (user) => {
    console.log("🎫 [DEBUG] Criando access token para usuário:", {
        id: user.id,
        name: user.name,
        profile: user.profile,
        companyId: user.companyId
    });
    const { secret, expiresIn } = auth_1.default;
    console.log("🔐 [DEBUG] Configurações do token:", {
        hasSecret: !!secret,
        expiresIn,
        secretLength: secret?.length
    });
    const payload = {
        username: user.name,
        profile: user.profile,
        id: user.id,
        companyId: user.companyId
    };
    console.log("📦 [DEBUG] Payload do token:", payload);
    const token = (0, jsonwebtoken_1.sign)(payload, secret, { expiresIn });
    console.log("✅ [DEBUG] Token criado:", token.substring(0, 50) + "...");
    return token;
};
exports.createAccessToken = createAccessToken;
const createRefreshToken = (user) => {
    const { refreshSecret, refreshExpiresIn } = auth_1.default;
    console.log("🔄 [DEBUG] Criando refresh token");
    return (0, jsonwebtoken_1.sign)({ id: user.id, tokenVersion: user.tokenVersion, companyId: user.companyId }, refreshSecret, {
        expiresIn: refreshExpiresIn
    });
};
exports.createRefreshToken = createRefreshToken;
//# sourceMappingURL=CreateTokens.js.map