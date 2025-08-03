// Configuração Gerencianet desabilitada para ambiente de desenvolvimento local
// Todos os certificados e dependências de PIX foram removidos para funcionamento 100% local

// Configuração vazia para evitar erros de importação
const config = {
  sandbox: true,
  client_id: "",
  client_secret: "",
  pix_cert: ""
};

export = config;

