import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const recordVisit = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z.object({ visitorId: z.string().regex(/^[a-zA-Z0-9-]{8,64}$/), path: z.string().max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_visits")
      .insert({ visitor_id: data.visitorId, path: data.path.slice(0, 200) || "/" });
    if (error) console.error(error);
    return { ok: !error };
  });
