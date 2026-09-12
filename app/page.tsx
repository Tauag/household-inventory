import { redirect } from "next/navigation";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { ItemList } from "@/components/item-list";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data) redirect("/login");

  return (
    <main className="flex flex-1 flex-col items-center gap-4 p-6">
      <div className="flex w-full max-w-md items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Household Inventory</h1>
        <form action={signOut}>
          <Button variant="outline" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </div>
      <ItemList />
    </main>
  );
}
