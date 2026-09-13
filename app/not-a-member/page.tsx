import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { signOut } from "@/app/actions";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Not on the list" };

export default function NotAMemberPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="mb-4 flex size-14 items-center justify-center rounded-xl border bg-muted">
          <HugeiconsIcon icon={Alert02Icon} className="size-6" />
        </div>
        <h1 className="text-[22px] font-semibold tracking-tight">
          You&apos;re not on the household list
        </h1>
        <p className="text-[15px] leading-[22px] text-muted-foreground text-pretty">
          Ask a household member to add your email, or sign in with a different Google account.
        </p>
      </div>

      <form action={signOut}>
        <Button type="submit" variant="outline" size="xl" className="w-full">
          <HugeiconsIcon icon={Logout01Icon} />
          Sign out
        </Button>
      </form>
    </main>
  );
}
