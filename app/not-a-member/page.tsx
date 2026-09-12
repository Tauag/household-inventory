import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";

export default function NotAMemberPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">You&apos;re not on the household list</h1>
      <p className="text-muted-foreground">
        Ask a household member to add your email, or sign in with a different
        Google account.
      </p>
      <form action={signOut}>
        <Button variant="outline" type="submit">
          Sign out
        </Button>
      </form>
    </main>
  );
}
