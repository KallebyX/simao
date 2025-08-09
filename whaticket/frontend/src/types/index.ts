// Core Types for Whaticket Frontend
export interface User {
  id: number;
  name: string;
  email: string;
  profile: 'admin' | 'user' | 'supervisor';
  companyId: number;
  queues: Queue[];
  whatsapp?: Whatsapp;
  startWork?: string;
  endWork?: string;
  allTicket?: string;
  tokenVersion?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  status: boolean;
  dueDate: string;
  recurrence: string;
  document?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: number;
  name: string;
  number: string;
  profilePicUrl?: string;
  isGroup: boolean;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  extraInfo?: ContactCustomField[];
  tags?: Tag[];
  wallets?: ContactWallet[];
}

export interface ContactCustomField {
  id: number;
  name: string;
  value: string;
  contactId: number;
}

export interface Tag {
  id: number;
  name: string;
  color: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContactWallet {
  id: number;
  walletId: number;
  contactId: number;
  companyId: number;
  wallet?: Wallet;
}

export interface Wallet {
  id: number;
  name: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket {
  id: number;
  status: 'open' | 'pending' | 'closed';
  lastMessage?: string;
  contactId: number;
  userId?: number;
  whatsappId: number;
  companyId: number;
  queueId?: number;
  chatbot?: boolean;
  queueOptionId?: number;
  amountUsedBotQueues?: number;
  isGroup: boolean;
  unreadMessages?: number;
  whatsappName?: string;
  contact?: Contact;
  queue?: Queue;
  user?: User;
  whatsapp?: Whatsapp;
  messages?: Message[];
  tags?: Tag[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  ticketId: number;
  contactId: number;
  body: string;
  fromMe: boolean;
  mediaType?: 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'voice';
  mediaUrl?: string;
  read: boolean;
  quotedMsgId?: string;
  ack?: number;
  remoteJid?: string;
  participant?: string;
  dataJson?: string;
  ticketTrakingId?: number;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  contact?: Contact;
  quotedMsg?: Message;
  ticket?: Ticket;
}

export interface Queue {
  id: number;
  name: string;
  color: string;
  greetingMessage?: string;
  complationMessage?: string;
  outOfHoursMessage?: string;
  ratingMessage?: string;
  token?: string;
  orderQueue?: number;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  chatbots?: Chatbot[];
}

export interface Chatbot {
  id: number;
  name: string;
  color: string;
  greetingMessage?: string;
  queueId: number;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  options?: ChatbotOption[];
}

export interface ChatbotOption {
  id: number;
  name: string;
  message?: string;
  queueId?: number;
  parentId?: number;
  chatbotId: number;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  children?: ChatbotOption[];
}

export interface Whatsapp {
  id: number;
  name: string;
  session: string;
  qrcode?: string;
  status: 'OPENING' | 'PAIRING' | 'TIMEOUT' | 'CONNECTED' | 'DISCONNECTED';
  battery?: string;
  plugged?: boolean;
  retries: number;
  companyId: number;
  token?: string;
  phone?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  queues?: Queue[];
}

export interface Campaign {
  id: number;
  name: string;
  message1?: string;
  message2?: string;
  message3?: string;
  message4?: string;
  message5?: string;
  confirmationMessage1?: string;
  confirmationMessage2?: string;
  confirmationMessage3?: string;
  confirmationMessage4?: string;
  confirmationMessage5?: string;
  companyId: number;
  dueDate: string;
  scheduledAt: string;
  completedAt?: string;
  status: 'INATIVA' | 'PROGRAMADA' | 'EM_ANDAMENTO' | 'CANCELADA' | 'FINALIZADA';
  confirmation: boolean;
  contactList?: CampaignContact[];
  whatsapp?: Whatsapp;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignContact {
  id: number;
  campaignId: number;
  contactId: number;
  body: string;
  confirmation?: boolean;
  confirmationRequestedAt?: string;
  confirmedAt?: string;
  deliveredAt?: string;
  ack?: number;
  contact?: Contact;
}

export interface QuickMessage {
  id: number;
  shortcode: string;
  message: string;
  companyId: number;
  userId?: number;
  geral?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: number;
  name: string;
  users: number;
  connections: number;
  queues: number;
  value: number;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface PaginatedResponse<T> {
  records: T[];
  count: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  details?: any;
}

// Socket events
export interface SocketData {
  action: string;
  ticket?: Ticket;
  message?: Message;
  contact?: Contact;
  user?: User;
  whatsapp?: Whatsapp;
  queue?: Queue;
  campaign?: Campaign;
  companyId?: number;
  userId?: number;
}

// UI State types
export interface AppState {
  user: User | null;
  company: Company | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface TicketFilters {
  status?: 'open' | 'pending' | 'closed';
  userId?: number;
  queueId?: number;
  search?: string;
  date?: string;
  tags?: number[];
  showAll?: boolean;
  withUnreadMessages?: boolean;
}

export interface MessageFilters {
  ticketId: number;
  pageNumber?: number;
}

// Form types
export interface ContactFormData {
  name: string;
  number: string;
  email?: string;
  extraInfo?: Array<{ name: string; value: string }>;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  profile: 'admin' | 'user' | 'supervisor';
  queueIds?: number[];
  whatsappId?: number;
  startWork?: string;
  endWork?: string;
  allTicket?: string;
}

export interface QueueFormData {
  name: string;
  color: string;
  greetingMessage?: string;
  complationMessage?: string;
  outOfHoursMessage?: string;
  ratingMessage?: string;
  orderQueue?: number;
  chatbots?: Array<{
    name: string;
    greetingMessage?: string;
    options?: Array<{
      name: string;
      message?: string;
      queueId?: number;
    }>;
  }>;
}

export interface WhatsappFormData {
  name: string;
  isDefault?: boolean;
  queueIds?: number[];
}

export interface CampaignFormData {
  name: string;
  message1?: string;
  message2?: string;
  message3?: string;
  message4?: string;
  message5?: string;
  confirmationMessage1?: string;
  confirmationMessage2?: string;
  confirmationMessage3?: string;
  confirmationMessage4?: string;
  confirmationMessage5?: string;
  dueDate: string;
  scheduledAt: string;
  confirmation: boolean;
  contactList?: number[];
  whatsappId: number;
}

// Dashboard types
export interface DashboardData {
  usersOnline: number;
  connectionsCount: number;
  openTickets: number;
  closedTickets: number;
  pendingTickets: number;
  avgWaitTime: number;
  avgResolutionTime: number;
  messagesCount: {
    sent: number;
    received: number;
  };
  ticketsByUser: Array<{
    userId: number;
    userName: string;
    count: number;
  }>;
  ticketsByQueue: Array<{
    queueId: number;
    queueName: string;
    count: number;
  }>;
  ticketsByPeriod: Array<{
    date: string;
    count: number;
  }>;
}

// Notification types
export interface NotificationState {
  show: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  autoHide?: boolean;
}