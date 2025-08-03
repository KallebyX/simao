import 'dotenv/config';
import app from "./app-minimal";

console.log('🚀 INICIANDO SERVIDOR MÍNIMO...');
console.log('📊 Variáveis de ambiente:');
console.log('PORT:', process.env.PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_HOST:', process.env.DB_HOST);

const server = app.listen(process.env.PORT, () => {
  console.log('✅ SERVIDOR HTTP INICIADO COM SUCESSO!');
  console.log(`🎉 Server started on port: ${process.env.PORT}`);
  console.log(`🌐 Acesse: http://localhost:${process.env.PORT}`);
});

process.on("uncaughtException", err => {
  console.error(`${new Date().toUTCString()} uncaughtException:`, err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, p) => {
  console.error(
    `${new Date().toUTCString()} unhandledRejection:`,
    reason,
    p
  );
  process.exit(1);
});

export default server;