-- Short song share links: astra.mmusic.workers.dev/s/<code>
CREATE TABLE IF NOT EXISTS public.song_shares (
  code TEXT PRIMARY KEY CHECK (char_length(code) BETWEEN 6 AND 12),
  src TEXT NOT NULL CHECK (src IN ('sv', 'yt')),
  song_id TEXT NOT NULL CHECK (char_length(song_id) BETWEEN 1 AND 64),
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  artist TEXT NOT NULL DEFAULT '' CHECK (char_length(artist) <= 200),
  art TEXT NOT NULL DEFAULT '' CHECK (char_length(art) <= 600),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Only the site server (service role) reads and writes this table.
ALTER TABLE public.song_shares ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.song_shares TO service_role;
