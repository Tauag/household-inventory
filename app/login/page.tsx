import { HugeiconsIcon } from "@hugeicons/react";
import { Package01Icon } from "@hugeicons/core-free-icons";
import { signInWithGoogle } from "@/app/actions";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Sign in" };

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden className="size-[18px]">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.84.86-3.05.86-2.35 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path fill="#FBBC05" d="M3.96 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.96a9 9 0 0 0 0 8.08l3-2.33Z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-6 py-16 text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="mb-4 flex size-14 items-center justify-center rounded-xl border bg-muted">
          <HugeiconsIcon icon={Package01Icon} className="size-6" />
        </div>
        <h1 className="text-[22px] font-semibold tracking-tight">Household Inventory</h1>
        <p className="text-[15px] leading-[22px] text-muted-foreground text-pretty">
          What we have, and what has run out. Sign in with your household Google account.
        </p>
      </div>

      <form action={signInWithGoogle}>
        <Button type="submit" variant="outline" size="xl" className="w-full">
          <GoogleMark />
          Continue with Google
        </Button>
      </form>

      <p className="text-xs leading-[18px] text-muted-foreground text-pretty">
        Only addresses on the household list can open the inventory.
      </p>
    </main>
  );
}
