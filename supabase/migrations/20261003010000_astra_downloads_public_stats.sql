-- Real download clicks + public (anon-safe) aggregate stats
CREATE TABLE IF NOT EXISTS public.site_downloads (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL CHECK (char_length(visitor_id) BETWEEN 8 AND 64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_downloads TO authenticated;
GRANT ALL ON public.site_downloads TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.site_downloads_id_seq TO service_role;
ALTER TABLE public.site_downloads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin reads downloads" ON public.site_downloads;
CREATE POLICY "Admin reads downloads" ON public.site_downloads FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX IF NOT EXISTS site_downloads_visitor_idx ON public.site_downloads (visitor_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.public_stats()
RETURNS TABLE(downloads bigint, rating_count bigint, rating_sum bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(*) FROM public.site_downloads),
    (SELECT count(*) FROM public.astra_comments WHERE status = 'approved' AND rating IS NOT NULL),
    (SELECT COALESCE(sum(rating), 0)::bigint FROM public.astra_comments WHERE status = 'approved' AND rating IS NOT NULL)
$$;
REVOKE EXECUTE ON FUNCTION public.public_stats() FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.public_stats() TO service_role;
