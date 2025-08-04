import { sign } from "jsonwebtoken";
import authConfig from "../config/auth";
import User from "../models/User";

export const createAccessToken = (user: User): string => {
  console.log("🎫 [DEBUG] Criando access token para usuário:", {
    id: user.id,
    name: user.name,
    profile: user.profile,
    companyId: user.companyId
  });
  
  const { secret, expiresIn } = authConfig;
  console.log("🔐 [DEBUG] Configurações do token:", {
    hasSecret: !!secret,
    expiresIn,
    secretLength: secret?.length
  });

  const payload = {
    username: user.name, // CORRIGIDO: era "usarname"
    profile: user.profile,
    id: user.id,
    companyId: user.companyId
  };

  console.log("📦 [DEBUG] Payload do token:", payload);

  const token = sign(payload, secret, { expiresIn });
  console.log("✅ [DEBUG] Token criado:", token.substring(0, 50) + "...");
  
  return token;
};

export const createRefreshToken = (user: User): string => {
  const { refreshSecret, refreshExpiresIn } = authConfig;
  
  console.log("🔄 [DEBUG] Criando refresh token");

  return sign(
    { id: user.id, tokenVersion: user.tokenVersion, companyId: user.companyId },
    refreshSecret,
    {
      expiresIn: refreshExpiresIn
    }
  );
};
