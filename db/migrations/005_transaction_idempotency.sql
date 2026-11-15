-- Idempotency ledger for transaction creates submitted by offline clients.
-- The operation key is generated once on the client and reused for every retry.
CREATE TABLE IF NOT EXISTS transaction_mutations (
  user_id BIGINT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  mutation_id UUID NOT NULL,
  transaction_id BIGINT NOT NULL,
  created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, mutation_id)
);
CREATE INDEX IF NOT EXISTS idx_transaction_mutations_created_at ON transaction_mutations(created_at);
