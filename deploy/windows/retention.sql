-- Usage/error/system/login logs: retain 90 days.
DELETE FROM logs
WHERE type <> 3
  AND created_at < EXTRACT(EPOCH FROM (NOW() - INTERVAL '90 days'))::bigint;

-- Administrative audit logs (type 3): retain one year.
DELETE FROM logs
WHERE type = 3
  AND created_at < EXTRACT(EPOCH FROM (NOW() - INTERVAL '1 year'))::bigint;

