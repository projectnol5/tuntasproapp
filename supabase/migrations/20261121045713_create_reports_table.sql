/*
# Create reports table with monthly sequential numbering

1. New Tables
- `reports`
  - `id` (uuid, primary key)
  - `period_key` (text, not null) — month period like "2026-11"; numbering restarts each new period
  - `report_number` (integer, not null) — sequential number within the period: 001, 002, ... locked forever once saved
  - `report_code` (text, generated) — human-readable code like "TP-202611-001"
  - `data` (jsonb, not null) — the full report payload (activity, stores, items, photos, signatures)
  - `created_at` (timestamptz)
  - `submitted_at` (timestamptz, default now)

2. Functions
- `submit_report(p_data jsonb)` — SECURITY DEFINER. Computes the next number for the
  current month period (Jakarta time) as MAX(report_number)+1 and inserts the row in one
  step, so saved numbers are locked and never reused. Returns the new report id.

3. Security
- Enable RLS on `reports`.
- Policies for `anon` + `authenticated` (single-tenant app, no sign-in screen):
  SELECT/INSERT/DELETE allowed; UPDATE not granted so a saved number can never change.
- Grant SELECT, INSERT, DELETE on the table to `anon, authenticated`.
- Grant EXECUTE on `submit_report` to `anon, authenticated`; revoke from PUBLIC.
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_key text NOT NULL,
  report_number integer NOT NULL,
  report_code text GENERATED ALWAYS AS ('TP-' || replace(period_key, '-', '') || '-' || LPAD(report_number::text, 3, '0')) STORED,
  data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON reports TO anon, authenticated;

DROP POLICY IF EXISTS "reports_select" ON reports;
CREATE POLICY "reports_select" ON reports
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "reports_insert" ON reports;
CREATE POLICY "reports_insert" ON reports
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "reports_delete" ON reports;
CREATE POLICY "reports_delete" ON reports
FOR DELETE
TO anon, authenticated
USING (true);

CREATE OR REPLACE FUNCTION submit_report(p_data jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period text;
  v_num integer;
  v_id uuid;
BEGIN
  v_period := to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM');

  SELECT COALESCE(MAX(report_number), 0) + 1 INTO v_num
  FROM reports
  WHERE period_key = v_period;

  INSERT INTO reports (period_key, report_number, data)
  VALUES (v_period, v_num, p_data)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION submit_report(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_report(jsonb) TO anon, authenticated;
