-- Migration 001: Criar modelos de piscicultura
-- Simão IA Rural - Sistema completo de gestão de piscicultura
-- Data: 2024-07-22

-- 1. Atualizar tabela de leads com campos de personalização
ALTER TABLE leads ADD COLUMN IF NOT EXISTS genero_detectado VARCHAR(10);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tratamento_preferido VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS regiao_linguistica VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contexto_rural TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS preferencias_comunicacao TEXT;

-- Comentários para campos de personalização
COMMENT ON COLUMN leads.genero_detectado IS 'Gênero detectado automaticamente: masculino, feminino, indefinido';
COMMENT ON COLUMN leads.tratamento_preferido IS 'Tratamento personalizado: Seu João, Dona Maria, etc.';
COMMENT ON COLUMN leads.regiao_linguistica IS 'Região linguística: nordeste, sul, sudeste, etc.';
COMMENT ON COLUMN leads.contexto_rural IS 'Informações sobre contexto rural do cliente';
COMMENT ON COLUMN leads.preferencias_comunicacao IS 'JSON com preferências de comunicação';

-- 2. Criar tabela de espécies de peixes
CREATE TABLE IF NOT EXISTS especies_peixe (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    nome_cientifico VARCHAR(150) NOT NULL,
    peso_medio_adulto DECIMAL(8,3), -- em kg
    tempo_engorda INTEGER, -- em dias
    temperatura_ideal_min DECIMAL(4,2), -- em Celsius
    temperatura_ideal_max DECIMAL(4,2), -- em Celsius
    ph_ideal_min DECIMAL(3,2),
    ph_ideal_max DECIMAL(3,2),
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cliente_id, nome)
);

COMMENT ON TABLE especies_peixe IS 'Cadastro de espécies de peixes para cada cliente';
COMMENT ON COLUMN especies_peixe.peso_medio_adulto IS 'Peso médio quando adulto em kg';
COMMENT ON COLUMN especies_peixe.tempo_engorda IS 'Tempo médio para engorda em dias';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_especies_cliente ON especies_peixe(cliente_id);
CREATE INDEX IF NOT EXISTS idx_especies_nome ON especies_peixe(nome);

-- 3. Criar tabela de viveiros
CREATE TABLE IF NOT EXISTS viveiros (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    tipo_sistema VARCHAR(50) DEFAULT 'escavado', -- escavado, tanque-rede, raceways, etc.
    capacidade_litros DECIMAL(12,2) NOT NULL,
    profundidade_media DECIMAL(5,2), -- em metros
    formato VARCHAR(50), -- retangular, circular, irregular
    revestimento VARCHAR(50), -- terra, lona, concreto, fibra
    aeracao BOOLEAN DEFAULT FALSE,
    filtragem BOOLEAN DEFAULT FALSE,
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cliente_id, nome)
);

COMMENT ON TABLE viveiros IS 'Cadastro de viveiros/tanques de cada cliente';
COMMENT ON COLUMN viveiros.capacidade_litros IS 'Capacidade total em litros';
COMMENT ON COLUMN viveiros.profundidade_media IS 'Profundidade média em metros';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_viveiros_cliente ON viveiros(cliente_id);
CREATE INDEX IF NOT EXISTS idx_viveiros_tipo ON viveiros(tipo_sistema);

-- 4. Criar tabela de lotes de peixes
CREATE TABLE IF NOT EXISTS lotes_peixe (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    especie_id INTEGER NOT NULL REFERENCES especies_peixe(id) ON DELETE CASCADE,
    viveiro_id INTEGER NOT NULL REFERENCES viveiros(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    quantidade_inicial INTEGER NOT NULL,
    quantidade_atual INTEGER NOT NULL,
    peso_medio_inicial DECIMAL(8,3) NOT NULL, -- em kg
    peso_medio_atual DECIMAL(8,3) NOT NULL, -- em kg
    data_povoamento TIMESTAMP NOT NULL,
    data_previsao_colheita TIMESTAMP,
    custo_alevinos DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ativo', -- ativo, colhido, mortalidade_total
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_ultima_movimentacao TIMESTAMP,
    UNIQUE(cliente_id, codigo)
);

COMMENT ON TABLE lotes_peixe IS 'Lotes de peixes em cada viveiro';
COMMENT ON COLUMN lotes_peixe.peso_medio_inicial IS 'Peso médio inicial dos peixes em kg';
COMMENT ON COLUMN lotes_peixe.peso_medio_atual IS 'Peso médio atual dos peixes em kg';
COMMENT ON COLUMN lotes_peixe.custo_alevinos IS 'Custo total dos alevinos em R$';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_lotes_cliente ON lotes_peixe(cliente_id);
CREATE INDEX IF NOT EXISTS idx_lotes_especie ON lotes_peixe(especie_id);
CREATE INDEX IF NOT EXISTS idx_lotes_viveiro ON lotes_peixe(viveiro_id);
CREATE INDEX IF NOT EXISTS idx_lotes_status ON lotes_peixe(status);
CREATE INDEX IF NOT EXISTS idx_lotes_povoamento ON lotes_peixe(data_povoamento);

-- 5. Criar tipos ENUM para movimentação de estoque
CREATE TYPE IF NOT EXISTS tipo_movimentacao AS ENUM (
    'entrada',      -- Entrada de alevinos
    'saida',        -- Saída para venda
    'mortalidade',  -- Morte de peixes
    'transferencia',-- Transferência entre viveiros
    'reposicao',    -- Reposição de estoque
    'venda'         -- Venda direta
);

-- 6. Criar tabela de movimentação de estoque
CREATE TABLE IF NOT EXISTS movimentacao_estoque (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    lote_id INTEGER NOT NULL REFERENCES lotes_peixe(id) ON DELETE CASCADE,
    tipo tipo_movimentacao NOT NULL,
    quantidade INTEGER NOT NULL,
    peso_medio DECIMAL(8,3), -- em kg
    valor_unitario DECIMAL(10,2), -- valor por peixe ou por kg
    descricao TEXT,
    data_movimentacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE movimentacao_estoque IS 'Histórico de movimentações de estoque de peixes';
COMMENT ON COLUMN movimentacao_estoque.peso_medio IS 'Peso médio dos peixes movimentados em kg';
COMMENT ON COLUMN movimentacao_estoque.valor_unitario IS 'Valor unitário em R$';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_movimentacao_cliente ON movimentacao_estoque(cliente_id);
CREATE INDEX IF NOT EXISTS idx_movimentacao_lote ON movimentacao_estoque(lote_id);
CREATE INDEX IF NOT EXISTS idx_movimentacao_tipo ON movimentacao_estoque(tipo);
CREATE INDEX IF NOT EXISTS idx_movimentacao_data ON movimentacao_estoque(data_movimentacao);

-- 7. Criar tabela de registros de alimentação
CREATE TABLE IF NOT EXISTS registro_alimentacao (
    id SERIAL PRIMARY KEY,
    lote_id INTEGER NOT NULL REFERENCES lotes_peixe(id) ON DELETE CASCADE,
    quantidade_racao DECIMAL(8,3) NOT NULL, -- em kg
    tipo_racao VARCHAR(100) NOT NULL,
    custo_racao DECIMAL(10,2),
    observacoes TEXT,
    data_alimentacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE registro_alimentacao IS 'Registro de alimentação dos lotes de peixes';
COMMENT ON COLUMN registro_alimentacao.quantidade_racao IS 'Quantidade de ração em kg';
COMMENT ON COLUMN registro_alimentacao.custo_racao IS 'Custo da ração em R$';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_alimentacao_lote ON registro_alimentacao(lote_id);
CREATE INDEX IF NOT EXISTS idx_alimentacao_data ON registro_alimentacao(data_alimentacao);
CREATE INDEX IF NOT EXISTS idx_alimentacao_tipo ON registro_alimentacao(tipo_racao);

-- 8. Criar tabela de qualidade da água
CREATE TABLE IF NOT EXISTS qualidade_agua (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    viveiro_id INTEGER NOT NULL REFERENCES viveiros(id) ON DELETE CASCADE,
    ph DECIMAL(4,2),
    oxigenio_dissolvido DECIMAL(5,2), -- mg/L
    temperatura DECIMAL(4,2), -- Celsius
    amonia DECIMAL(6,3), -- mg/L
    nitrito DECIMAL(6,3), -- mg/L
    nitrato DECIMAL(7,3), -- mg/L
    alcalinidade DECIMAL(7,2), -- mg/L CaCO3
    dureza DECIMAL(7,2), -- mg/L CaCO3
    transparencia DECIMAL(5,2), -- cm (disco de Secchi)
    observacoes TEXT,
    data_medicao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE qualidade_agua IS 'Medições de qualidade da água dos viveiros';
COMMENT ON COLUMN qualidade_agua.oxigenio_dissolvido IS 'Oxigênio dissolvido em mg/L';
COMMENT ON COLUMN qualidade_agua.transparencia IS 'Transparência em cm (disco de Secchi)';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_qualidade_cliente ON qualidade_agua(cliente_id);
CREATE INDEX IF NOT EXISTS idx_qualidade_viveiro ON qualidade_agua(viveiro_id);
CREATE INDEX IF NOT EXISTS idx_qualidade_data ON qualidade_agua(data_medicao);

-- 9. Criar tabela de parâmetros ideais por espécie
CREATE TABLE IF NOT EXISTS parametros_ideais (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    especie_id INTEGER NOT NULL REFERENCES especies_peixe(id) ON DELETE CASCADE,
    ph_min DECIMAL(4,2),
    ph_max DECIMAL(4,2),
    oxigenio_min DECIMAL(5,2), -- mg/L
    temperatura_min DECIMAL(4,2), -- Celsius
    temperatura_max DECIMAL(4,2), -- Celsius
    amonia_max DECIMAL(6,3), -- mg/L
    nitrito_max DECIMAL(6,3), -- mg/L
    nitrato_max DECIMAL(7,3), -- mg/L
    alcalinidade_min DECIMAL(7,2), -- mg/L CaCO3
    alcalinidade_max DECIMAL(7,2), -- mg/L CaCO3
    dureza_min DECIMAL(7,2), -- mg/L CaCO3
    dureza_max DECIMAL(7,2), -- mg/L CaCO3
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cliente_id, especie_id)
);

COMMENT ON TABLE parametros_ideais IS 'Parâmetros ideais de qualidade de água por espécie';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_parametros_cliente ON parametros_ideais(cliente_id);
CREATE INDEX IF NOT EXISTS idx_parametros_especie ON parametros_ideais(especie_id);

-- 10. Criar tipos ENUM para alertas de qualidade
CREATE TYPE IF NOT EXISTS severidade_alerta AS ENUM ('baixa', 'media', 'alta');
CREATE TYPE IF NOT EXISTS status_alerta AS ENUM ('ativo', 'resolvido', 'ignorado');

-- 11. Criar tabela de alertas de qualidade
CREATE TABLE IF NOT EXISTS alertas_qualidade (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    medicao_id INTEGER NOT NULL REFERENCES qualidade_agua(id) ON DELETE CASCADE,
    parametro VARCHAR(50) NOT NULL, -- qual parâmetro está fora
    valor_medido DECIMAL(10,3) NOT NULL,
    valor_ideal_min DECIMAL(10,3),
    valor_ideal_max DECIMAL(10,3),
    severidade severidade_alerta NOT NULL DEFAULT 'media',
    status status_alerta NOT NULL DEFAULT 'ativo',
    mensagem TEXT NOT NULL,
    recomendacao TEXT,
    observacoes_resolucao TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_resolucao TIMESTAMP
);

COMMENT ON TABLE alertas_qualidade IS 'Alertas gerados por parâmetros de qualidade fora do ideal';

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_alertas_cliente ON alertas_qualidade(cliente_id);
CREATE INDEX IF NOT EXISTS idx_alertas_medicao ON alertas_qualidade(medicao_id);
CREATE INDEX IF NOT EXISTS idx_alertas_status ON alertas_qualidade(status);
CREATE INDEX IF NOT EXISTS idx_alertas_severidade ON alertas_qualidade(severidade);
CREATE INDEX IF NOT EXISTS idx_alertas_data ON alertas_qualidade(data_criacao);

-- 12. Triggers para atualização automática de timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_atualizacao = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers de atualização
DROP TRIGGER IF EXISTS trigger_especies_update ON especies_peixe;
CREATE TRIGGER trigger_especies_update
    BEFORE UPDATE ON especies_peixe
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_viveiros_update ON viveiros;
CREATE TRIGGER trigger_viveiros_update
    BEFORE UPDATE ON viveiros
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_lotes_update ON lotes_peixe;
CREATE TRIGGER trigger_lotes_update
    BEFORE UPDATE ON lotes_peixe
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS trigger_parametros_update ON parametros_ideais;
CREATE TRIGGER trigger_parametros_update
    BEFORE UPDATE ON parametros_ideais
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- 13. Inserir dados seed básicos

-- Espécies mais comuns na piscicultura brasileira
INSERT INTO especies_peixe (cliente_id, nome, nome_cientifico, peso_medio_adulto, tempo_engorda, temperatura_ideal_min, temperatura_ideal_max, ph_ideal_min, ph_ideal_max) VALUES
-- Será inserido via script Python com cliente_id válido
-- (1, 'Tilápia', 'Oreochromis niloticus', 0.8, 180, 24.0, 30.0, 6.5, 8.5),
-- (1, 'Tambaqui', 'Colossoma macropomum', 3.0, 365, 26.0, 32.0, 6.0, 8.0),
-- (1, 'Pirarucu', 'Arapaima gigas', 50.0, 730, 24.0, 30.0, 6.0, 7.5),
-- (1, 'Pacu', 'Piaractus mesopotamicus', 2.5, 300, 22.0, 28.0, 6.5, 8.0)
ON CONFLICT (cliente_id, nome) DO NOTHING;

-- Comentário final
COMMENT ON SCHEMA public IS 'Schema principal do Simão IA Rural - Sistema de gestão de piscicultura com IA';

-- Log da migration
INSERT INTO public.schema_migrations (version, applied_at) VALUES ('001_create_piscicultura_models', CURRENT_TIMESTAMP)
ON CONFLICT (version) DO NOTHING;