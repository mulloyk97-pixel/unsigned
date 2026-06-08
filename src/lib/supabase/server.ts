import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server Supabase client for Server Components / Route Handlers. Reads + writes
// the auth cookies via Next's cookie store (await — async in Next 16).
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(toSet) {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component — cookie writes happen in
            // middleware instead; safe to ignore here.
          }
        },
      },
    },
  );
}
