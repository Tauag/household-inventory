import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // Belt-and-suspenders: proxy.ts already gates this route. Guards against a
  // matcher regression letting an unauthenticated request through.
  if (!data) redirect("/login");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Household Inventory</h1>
      <p className="text-muted-foreground">Signed in as {data.claims.email}.</p>
      <form action={signOut}>
        <Button variant="outline" type="submit">
          Sign out
        </Button>
      </form>
    </main>
  );
}
