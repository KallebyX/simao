-- Migration 000: Inicializar sistema de migrations
-- Simão IA Rural - Controle de versioning do banco de dados
-- Data: 2024-07-22

-- Criar tabela de controle de migrations se não existir
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(100) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

COMMENT ON TABLE schema_migrations IS 'Controle de versões das migrations aplicadas no banco';

-- Inserir migration inicial
INSERT INTO schema_migrations (version, description) VALUES 
('000_init_migrations', 'Inicialização do sistema de migrations')
ON CONFLICT (version) DO NOTHING;