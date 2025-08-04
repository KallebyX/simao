import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

import AppError from "../errors/AppError";
import authConfig from "../config/auth";

import { getIO } from "../libs/socket";
import ShowUserService from "../services/UserServices/ShowUserService";
import { updateUser } from "../helpers/updateUser";
// import { moment} from "moment-timezone"

interface TokenPayload {
  id: string;
  username: string;
  profile: string;
  companyId: number;
  iat: number;
  exp: number;
}

const isAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  console.log("🔍 [DEBUG] isAuth middleware iniciado");
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log("❌ [DEBUG] Nenhum header de autorização encontrado");
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  console.log("🔑 [DEBUG] Authorization header:", authHeader.substring(0, 50) + "...");

  const [, token] = authHeader.split(" ");

  if (!token) {
    console.log("❌ [DEBUG] Token não encontrado após split");
    throw new AppError("ERR_SESSION_EXPIRED", 401);
  }

  console.log("🎫 [DEBUG] Token extraído:", token.substring(0, 20) + "...");
  console.log("🔐 [DEBUG] JWT_SECRET definido:", !!authConfig.secret);

  try {
    const decoded = verify(token, authConfig.secret);
    console.log("✅ [DEBUG] Token decodificado com sucesso:", JSON.stringify(decoded, null, 2));
    
    const { id, profile, companyId } = decoded as TokenPayload;

    updateUser(id, companyId);

    req.user = {
      id,
      profile,
      companyId
    };
    
    console.log("👤 [DEBUG] Usuário autenticado:", { id, profile, companyId });
  } catch (err: any) {
    console.log("❌ [DEBUG] Erro na verificação do token:", err.message);
    console.log("❌ [DEBUG] Stack do erro:", err.stack);
    
    if (err.name === "TokenExpiredError") {
      console.log("⏰ [DEBUG] Token expirado");
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    } else if (err.name === "JsonWebTokenError") {
      console.log("🔒 [DEBUG] Token inválido");
      throw new AppError("ERR_SESSION_EXPIRED", 401);
    } else if (err.message === "ERR_SESSION_EXPIRED" && err.statusCode === 401) {
      throw new AppError(err.message, 401);
    } else {
      throw new AppError(
        "Invalid token. We'll try to assign a new one on next request",
        403
      );
    }
  }

  return next();
};

export default isAuth;