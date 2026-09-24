// Pings Supabase daily so its 7-day inactivity pause never triggers.
const keepSupabaseAlive = async () => {
  const res = await fetch(
    "https://lziakqwcjkkksjtvkqip.supabase.co/rest/v1/items?select=id&limit=1",
    { headers: { apikey: process.env.SUPABASE_PUBLISHABLE_KEY! } },
  );
  if (!res.ok) throw new Error(`Supabase ping failed: ${res.status}`);
};

export const config = { schedule: "0 12 * * *" };
export default keepSupabaseAlive;
