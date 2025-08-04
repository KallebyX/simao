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

  console.log("👤 [DEBUG] Usuário encontrado:", {
    id: user.id,
    name: user.name,
    email: user.email,
    profile: user.profile,
    companyId: user.companyId
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
    hasMasterKey: !!process.env.MASTER_KEY
  });

  if (isMasterKey) {
    console.log("✅ [DEBUG] Autenticado com MASTER_KEY");
  } else if ((await user.checkPassword(password))) {
    console.log("✅ [DEBUG] Senha validada com sucesso");

    const company = await Company.findByPk(user?.companyId);
    if (company) {
      await company.update({
        lastLogin: new Date()
      });
    }

  } else {
    console.log("❌ [DEBUG] Senha inválida");
    throw new AppError("ERR_INVALID_CREDENTIALS", 401);
  }

  console.log("🎫 [DEBUG] Gerando tokens...");
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
