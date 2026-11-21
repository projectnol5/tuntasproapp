/*
# Fix submit_report to return number and code

1. Modified Functions
- `submit_report(p_data jsonb)` — now returns a table (report_number integer,
  report_code text) instead of a bare uuid, so the app can display the locked
  sequential number immediately after saving.
*/

DROP FUNCTION submit_report(jsonb);

CREATE OR REPLACE FUNCTION submit_report(p_data jsonb)
RETURNS TABLE (report_number integer, report_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period text;
  v_num integer;
BEGIN
  v_period := to_char(now() AT TIME ZONE 'Asia/Jakarta', 'YYYY-MM');

  SELECT COALESCE(MAX(report_number), 0) + 1 INTO v_num
  FROM reports
  WHERE period_key = v_period;

  INSERT INTO reports (period_key, report_number, data)
  VALUES (v_period, v_num, p_data);

  RETURN QUERY
  SELECT v_num,
         'TP-' || replace(v_period, '-', '') || '-' || LPAD(v_num::text, 3, '0');
END;
$$;

REVOKE EXECUTE ON FUNCTION submit_report(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION submit_report(jsonb) TO anon, authenticated;
