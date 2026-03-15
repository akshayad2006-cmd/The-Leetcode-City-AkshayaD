-- ============================================================
-- 042: B2 Bomber and UFO Vehicles
-- Adds two new vehicles to the shop for the raid/fly mode.
-- ============================================================

INSERT INTO items (id, category, name, description, price_usd_cents, price_brl_cents, is_active, metadata)
VALUES
  ('raid_b2_bomber', 'effect', 'B-2 Bomber', 'Stealthy, sleek, and menacing flying wing. High maneuverability.', 299, 1490, true, '{"type":"raid_vehicle"}'),
  ('raid_ufo', 'effect', 'UFO', 'Extraterrestrial disc with alien technology. The truth is out there.', 399, 1990, true, '{"type":"raid_vehicle"}')
ON CONFLICT (id) DO NOTHING;
