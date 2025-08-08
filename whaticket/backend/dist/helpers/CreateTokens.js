"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRefreshToken = exports.createAccessToken = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const auth_1 = __importDefault(require("../config/auth"));
const createAccessToken = (user) => {
    console.log("🔍 [DEBUG] JWT Types - jsonwebtoken version:", require('jsonwebtoken/package.json').version);
    console.log("🔍 [DEBUG] @types/jsonwebtoken version:", require('@types/jsonwebtoken/package.json').version);
    const userId = user.get('id') || user.dataValues.id || user.id;
    const userName = user.get('name') || user.dataValues.name || user.name;
    const userProfile = user.get('profile') || user.dataValues.profile || user.profile;
    const userCompanyId = user.get('companyId') || user.dataValues.companyId || user.companyId;
    console.log("🎫 [DEBUG] Criando access token para usuário:", {
        id: userId,
        name: userName,
        profile: userProfile,
        companyId: userCompanyId
    });
    const { secret, expiresIn } = auth_1.default;
    console.log("🔐 [DEBUG] Configurações do token:", {
        hasSecret: !!secret,
        expiresIn,
        secretLength: secret?.length
    });
    const payload = {
        username: userName || "Admin",
        profile: userProfile || "admin",
        id: userId || 1,
        companyId: userCompanyId || 1
    };
    console.log("📦 [DEBUG] Payload do token:", payload);
    console.log("🔍 [DEBUG] Tipos antes do sign:", {
        payloadType: typeof payload,
        secretType: typeof secret,
        expiresInType: typeof expiresIn,
        secretValue: secret,
        expiresInValue: expiresIn
    });
    const jwtSign = jsonwebtoken_1.sign;
    const token = jwtSign(payload, secret, { expiresIn });
    console.log("✅ [DEBUG] Token criado:", String(token).substring(0, 50) + "...");
    return token;
};
exports.createAccessToken = createAccessToken;
const createRefreshToken = (user) => {
    const { refreshSecret, refreshExpiresIn } = auth_1.default;
    console.log("🔄 [DEBUG] Criando refresh token");
    const userId = user.get('id') || user.dataValues.id || user.id;
    const userTokenVersion = user.get('tokenVersion') || user.dataValues.tokenVersion || user.tokenVersion;
    const userCompanyId = user.get('companyId') || user.dataValues.companyId || user.companyId;
    const jwtSign = jsonwebtoken_1.sign;
    return jwtSign({ id: userId, tokenVersion: userTokenVersion, companyId: userCompanyId }, refreshSecret, { expiresIn: refreshExpiresIn });
};
exports.createRefreshToken = createRefreshToken;
//# sourceMappingURL=CreateTokens.js.map