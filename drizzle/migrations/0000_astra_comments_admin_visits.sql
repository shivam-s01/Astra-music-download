CREATE TABLE public.astra_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 2 AND 500),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.astra_comments TO anon;
GRANT SELECT, UPDATE, DELETE ON public.astra_comments TO authenticated;
GRANT ALL ON public.astra_comments TO service_role;
ALTER TABLE public.astra_comments ENABLE ROW LEVEL SECURITY;
CREATE INDEX astra_comments_created_idx ON public.astra_comments (created_at DESC);

CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- First account ever created becomes the only admin
CREATE OR REPLACE FUNCTION public.assign_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(424242);
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created_first_admin AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.assign_first_admin();

CREATE POLICY "Public reads approved comments" ON public.astra_comments FOR SELECT TO anon, authenticated USING (status = 'approved' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin updates comments" ON public.astra_comments FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin deletes comments" ON public.astra_comments FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.site_visits (
  id BIGSERIAL PRIMARY KEY,
  visitor_id TEXT NOT NULL CHECK (char_length(visitor_id) BETWEEN 8 AND 64),
  path TEXT NOT NULL DEFAULT '/',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_visits TO authenticated;
GRANT ALL ON public.site_visits TO service_role;
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin reads visits" ON public.site_visits FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX site_visits_created_idx ON public.site_visits (created_at DESC);

CREATE OR REPLACE FUNCTION public.visit_stats()
RETURNS TABLE(today_visitors bigint, total_visitors bigint, total_visits bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT count(DISTINCT visitor_id) FROM site_visits WHERE created_at >= (date_trunc('day', now() AT TIME ZONE 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata')),
    (SELECT count(DISTINCT visitor_id) FROM site_visits),
    (SELECT count(*) FROM site_visits)
  WHERE public.has_role(auth.uid(), 'admin')
$$;
REVOKE EXECUTE ON FUNCTION public.visit_stats() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.visit_stats() TO authenticated;