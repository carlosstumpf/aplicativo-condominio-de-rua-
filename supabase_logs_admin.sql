-- Tabela de auditoria de ações administrativas
CREATE TABLE IF NOT EXISTS logs_admin (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rua_id          UUID REFERENCES ruas(id),
    admin_telefone  TEXT NOT NULL,
    acao            TEXT NOT NULL,
    morador_id      UUID REFERENCES moradores(id),
    valor           DECIMAL(10,2),
    obs             TEXT,
    criado_em       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_logs_admin_rua ON logs_admin(rua_id);
CREATE INDEX IF NOT EXISTS idx_logs_admin_criado ON logs_admin(criado_em);
