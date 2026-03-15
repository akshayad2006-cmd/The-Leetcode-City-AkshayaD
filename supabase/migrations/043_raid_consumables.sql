-- ============================================================
-- 043: Raid Consumables & Defenses
-- Adds battle consumables, peace shields, and weekly limits.
-- ============================================================

-- 1. Add tracked fields to developers table
ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS last_raided_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS active_defenses JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Consumables Inventory Tracking Table
CREATE TABLE IF NOT EXISTS developer_consumables (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id    BIGINT      NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  item_id         TEXT        NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  quantity        INT         NOT NULL DEFAULT 0,
  weekly_uses     INT         NOT NULL DEFAULT 0,
  last_reset_week DATE        NOT NULL DEFAULT date_trunc('week', now())::date,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (developer_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_developer_consumables_dev ON developer_consumables(developer_id);

ALTER TABLE developer_consumables ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consumables_public_read" ON developer_consumables;
CREATE POLICY "consumables_public_read" ON developer_consumables FOR SELECT USING (true);

-- 3. Add Battle Items to the shop
INSERT INTO items (id, category, name, description, price_usd_cents, price_brl_cents, is_active, metadata)
VALUES
  -- Defensive
  ('anti_missile_system', 'consumable', 'Anti-Missile System', 'Grants +50% Defense Score against the next Air Attack.', 1500, 7500, true, '{"type":"defense", "target":"air"}'),
  ('anti_tank_mines',     'consumable', 'Anti-Tank Mines',     'Grants +50% Defense Score against the next Ground Attack.', 1500, 7500, true, '{"type":"defense", "target":"ground"}'),
  ('emp_shield',          'consumable', 'Faraday Cage',        'Reduces the attacker''s final score by 20% for 1 raid.', 1000, 5000, true, '{"type":"defense", "target":"both"}'),
  ('stealth_cloak',       'consumable', 'Hologram Cloak',      'Prevents attackers from scouting your stats, and limits combo to 1x.', 1200, 6000, true, '{"type":"defense", "target":"both"}'),
  
  -- Offensive
  ('emp_device',          'consumable', 'EMP Device',          'Neutralizes the defender''s active item before attack.', 1200, 6000, true, '{"type":"offense"}'),
  ('sabotage_virus',      'consumable', 'Sabotage Virus',      'Reduces the defender''s base defense score by 30%.', 600, 3000, true, '{"type":"offense"}'),
  
  -- Vehicles
  ('vehicle_tank',        'effect',     'Heavy Tank',          'Unlocks the Tank vehicle, changing your raid type to Ground Attack.', 2500, 12500, true, '{"type":"raid_vehicle"}')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_usd_cents = EXCLUDED.price_usd_cents,
  price_brl_cents = EXCLUDED.price_brl_cents,
  metadata = EXCLUDED.metadata;
