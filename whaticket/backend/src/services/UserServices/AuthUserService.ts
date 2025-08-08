import User from "../../models/User";
import AppError from "../../errors/AppError";
import {
  createAccessToken,
  createRefreshToken
} from "../../helpers/CreateTokens";
import { SerializeUser } from "../../helpers/SerializeUser";
import Queue from "../../models/Queue";
import Company from "../../models/Company";
import Setting from "../../models/Setting";
import CompaniesSettings from "../../models/CompaniesSettings";

interface SerializedUser {
  id: number;
  name: string;
  email: string;
  profile: string;
  queues: Queue[];
  companyId: number;
  allTicket: string;
  defaultTheme: string;
  defaultMenu: string;
  allowGroup?: boolean;
  allHistoric?: string;
  allUserChat?: string;
  userClosePendingTicket?: string;
  showDashboard?: string;
  token?: string;
}

interface Request {
  email: string;
  password: string;
}

interface Response {
  serializedUser: SerializedUser;
  token: string;
  refreshToken: string;
}

const AuthUserService = async ({
  email,
  password
}: Request): Promise<Response> => {
  console.log("🔍 [DEBUG] AuthUserService iniciado para email:", email);
  
  const user = await User.findOne({
    where: { email },
    include: ["queues", { model: Company, include: [{ model: CompaniesSettings }] }]
  });

  if (!user) {
    console.log("❌ [DEBUG] Usuário não encontrado para email:", email);
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  console.log("👤 [DEBUG] Objeto user completo:", JSON.stringify(user, null, 2));
  console.log("👤 [DEBUG] user.dataValues:", user.dataValues);
  console.log("👤 [DEBUG] user.toJSON():", user.toJSON ? user.toJSON() : "NO toJSON");
  
  console.log("👤 [DEBUG] Usuário encontrado (métodos):", {
    id: user.get('id') || user.dataValues?.id || (user as any).id,
    name: user.get('name') || user.dataValues?.name || (user as any).name,
    email: user.get('email') || user.dataValues?.email || (user as any).email,
    profile: user.get('profile') || user.dataValues?.profile || (user as any).profile,
    companyId: user.get('companyId') || user.dataValues?.companyId || (user as any).companyId
  });

  const Hr = new Date();
  console.log("⏰ [DEBUG] Horário atual:", Hr.toLocaleString());

  const hh: number = Hr.getHours() * 60 * 60;
  const mm: number = Hr.getMinutes() * 60;
  const hora = hh + mm;

  const inicio: string = user.get('startWork') || user.dataValues.startWork || "00:00";
  const hhinicio = Number(inicio.split(":")[0]) * 60 * 60;
  const mminicio = Number(inicio.split(":")[1]) * 60;
  const horainicio = hhinicio + mminicio;

  const termino: string = user.get('endWork') || user.dataValues.endWork || "23:59";
  const hhtermino = Number(termino.split(":")[0]) * 60 * 60;
  const mmtermino = Number(termino.split(":")[1]) * 60;
  const horatermino = hhtermino + mmtermino;

  console.log("⏰ [DEBUG] Validação de horário:", {
    horaAtual: `${Math.floor(hora/3600)}:${Math.floor((hora%3600)/60)}`,
    inicio,
    termino,
    permitido: hora >= horainicio && hora <= horatermino
  });

  if (hora < horainicio || hora > horatermino) {
    console.log("❌ [DEBUG] Usuário fora do horário de trabalho");
    throw new AppError("ERR_OUT_OF_HOURS", 401);
  }

  const isMasterKey = password === process.env.MASTER_KEY;
  console.log("🔑 [DEBUG] Validação de senha:", {
    isMasterKey,
    hasMasterKey: !!process.env.MASTER_KEY,
    passwordLength: password.length,
    hashFromDataValues: user.dataValues.passwordHash,
    hashFromGetDataValue: user.getDataValue ? user.getDataValue("passwordHash") : "NO_GET_DATA_VALUE"
  });

  console.log("🚀 [DEBUG] Iniciando validação - isMasterKey:", isMasterKey);

  if (isMasterKey) {
    console.log("✅ [DEBUG] Autenticado com MASTER_KEY");
  } else {
    console.log("🔍 [DEBUG] Entrando no ELSE - Testando checkPassword...");
    const passwordResult = await user.checkPassword(password);
    console.log("🔍 [DEBUG] Resultado checkPassword:", passwordResult);
    
    if (passwordResult) {
      console.log("✅ [DEBUG] Senha validada com sucesso");

      const company = await Company.findByPk(user?.companyId);
      if (company) {
        await company.update({
          lastLogin: new Date()
        });
      }

    } else {
      console.log("❌ [DEBUG] checkPassword retornou FALSE - Senha inválida");
      throw new AppError("ERR_INVALID_CREDENTIALS", 401);
    }
  }

  console.log("🎯 [DEBUG] Validação de senha concluída - prosseguindo...");

  console.log("🎫 [DEBUG] Gerando tokens...");
  
  // CAPTURA dados usando mesmo padrão do SerializeUser que funciona
  const userData = {
    id: user.get('id') || user.dataValues.id || user.id,
    name: user.get('name') || user.dataValues.name || user.name,
    profile: user.get('profile') || user.dataValues.profile || user.profile,
    companyId: user.get('companyId') || user.dataValues.companyId || user.companyId
  };
  
  console.log("🎯 [DEBUG] Dados capturados no AuthUserService:", userData);
  
  const token = createAccessToken(user);
  const refreshToken = createRefreshToken(user);

  console.log("👤 [DEBUG] Serializando usuário...");
  const serializedUser = await SerializeUser(user);

  console.log("✅ [DEBUG] AuthUserService concluído com sucesso");
  return {
    serializedUser,
    token,
    refreshToken
  };
};

export default AuthUserService;
