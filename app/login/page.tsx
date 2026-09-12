import { signInWithGoogle } from "@/app/actions";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Household Inventory</h1>
      <p className="text-muted-foreground">
        Sign in with the household Google account.
      </p>
      <form action={signInWithGoogle}>
        <Button type="submit">Sign in with Google</Button>
      </form>
    </main>
  );
}
