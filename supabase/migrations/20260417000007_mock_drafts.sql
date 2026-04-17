CREATE TABLE IF NOT EXISTS mock_drafts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text,
  status      text NOT NULL DEFAULT 'completed', -- completed | saved
  settings    jsonb NOT NULL DEFAULT '{}',
  picks       jsonb NOT NULL DEFAULT '[]',
  created_at  timestamptz DEFAULT now(),
  saved_at    timestamptz
);

CREATE INDEX idx_mock_drafts_user ON mock_drafts(user_id);
CREATE INDEX idx_mock_drafts_status ON mock_drafts(user_id, status);

ALTER TABLE mock_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mock_drafts_owner" ON mock_drafts
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
