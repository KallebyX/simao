import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

console.log('🏗️ INICIANDO APP MÍNIMO...');

const app = express();

// Configurações básicas apenas
const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:3000"];

app.use(cors({
  credentials: true,
  origin: allowedOrigins
}));

app.use(cookieParser());
app.use(express.json());

// Rota de teste básica
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: '🎉 WHATICKET BACKEND FUNCIONANDO!', 
    status: 'success',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'OK',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Middleware de tratamento de erros básico
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Erro:', err.message);
  return res.status(500).json({ error: "Internal server error" });
});

console.log('✅ APP MÍNIMO CONFIGURADO!');

export default app;