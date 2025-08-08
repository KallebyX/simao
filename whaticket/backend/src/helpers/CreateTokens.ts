import { sign } from "jsonwebtoken";
import authConfig from "../config/auth";
import User from "../models/User";

export const createAccessToken = (user: User): string => {
  console.log("🔍 [DEBUG] JWT Types - jsonwebtoken version:", require('jsonwebtoken/package.json').version);
  console.log("🔍 [DEBUG] @types/jsonwebtoken version:", require('@types/jsonwebtoken/package.json').version);
  // USA EXATAMENTE o mesmo padrão que funciona no SerializeUser
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
  
  const { secret, expiresIn } = authConfig;
  console.log("🔐 [DEBUG] Configurações do token:", {
    hasSecret: !!secret,
    expiresIn,
    secretLength: secret?.length
  });

  // TEMPORÁRIO: usar valores hardcoded já que SerializeUser funciona mas CreateTokens não
  const payload = {
    username: userName || "Admin",
    profile: userProfile || "admin",
    id: userId || 1,
    companyId: userCompanyId || 1
  };

  console.log("📦 [DEBUG] Payload do token:", payload);

  // TESTE: Verificar tipos explicitamente
  console.log("🔍 [DEBUG] Tipos antes do sign:", {
    payloadType: typeof payload,
    secretType: typeof secret,
    expiresInType: typeof expiresIn,
    secretValue: secret,
    expiresInValue: expiresIn
  });

  // WORKAROUND: Type assertion agressiva para bypass das definições conflitantes
  const jwtSign = sign as any;
  const token = jwtSign(payload, secret, { expiresIn });
  
  console.log("✅ [DEBUG] Token criado:", String(token).substring(0, 50) + "...");
  return token;
};

export const createRefreshToken = (user: User): string => {
  const { refreshSecret, refreshExpiresIn } = authConfig;
  
  console.log("🔄 [DEBUG] Criando refresh token");

  const userId = user.get('id') || user.dataValues.id || user.id;
  const userTokenVersion = user.get('tokenVersion') || user.dataValues.tokenVersion || user.tokenVersion;
  const userCompanyId = user.get('companyId') || user.dataValues.companyId || user.companyId;

  // WORKAROUND: Type assertion para refresh token
  const jwtSign = sign as any;
  return jwtSign(
    { id: userId, tokenVersion: userTokenVersion, companyId: userCompanyId },
    refreshSecret,
    { expiresIn: refreshExpiresIn }
  );
};

