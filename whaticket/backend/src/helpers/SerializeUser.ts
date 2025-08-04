import Queue from "../models/Queue";
import Company from "../models/Company";
import User from "../models/User";
import jwt from "jsonwebtoken";

interface SerializedUser {
  id: number;
  name: string;
  email: string;
  profile: string;
  companyId: number;
  company: Company | null;
  super: boolean;
  queues: Queue[];
  startWork: string;
  endWork: string;
  allTicket: string;
  whatsappId: number;
  profileImage: string;
  defaultTheme: string;
  defaultMenu: string;
  allHistoric: string;
  allUserChat?: string;
  defaultTicketsManagerWidth?: number;
  userClosePendingTicket?: string;
  showDashboard?: string;
  token?: string;
  allowGroup: boolean;
  allowRealTime: string;
  allowConnections: string;
}

export const SerializeUser = async (user: User): Promise<SerializedUser> => {
  // Gera um token de 32 bytes
  const generateToken = (userId: number | string): string => {
    // Gerar o token com base no userId e sua chave secreta
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" }); // Você pode definir o tempo de expiração conforme necessário
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
