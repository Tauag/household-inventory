"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Alert02Icon,
  Logout01Icon,
  Package01Icon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "cn";
import { signOut } from "@/app/actions";
import { useInventory } from "@/components/inventory";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { href: "/", label: "Items", icon: Package01Icon },
  { href: "/low", label: "Low stock", icon: Alert02Icon },
] as const;

function AccountMenu({ email }: { email: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon-xl" aria-label="Account" />}
      >
        <HugeiconsIcon icon={UserCircleIcon} className="size-6" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">
          {email}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <HugeiconsIcon icon={Logout01Icon} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppChrome({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { lowCount, openAdd } = useInventory();
  const active = NAV.find((n) => n.href === pathname) ?? NAV[0];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-2 backdrop-blur-sm sm:px-4">
        <span className="px-2 text-base font-semibold tracking-tight md:hidden">
          {active.label}
        </span>
        <span className="hidden px-2 text-base font-semibold tracking-tight md:block">
          Household Inventory
        </span>

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? "secondary" : "ghost"}
              size="xl"
              nativeButton={false}
              render={<Link href={item.href} />}
            >
              <HugeiconsIcon icon={item.icon} />
              {item.label}
              {item.href === "/low" && lowCount > 0 ? (
                <Badge variant="destructive">{lowCount}</Badge>
              ) : null}
            </Button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button size="xl" className="hidden md:inline-flex" onClick={openAdd}>
            <HugeiconsIcon icon={Add01Icon} />
            Add item
          </Button>
          <AccountMenu email={email} />
        </div>
      </header>

      <main className="flex flex-1 flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map((item) => {
          const current = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] outline-none focus-visible:bg-muted",
                current ? "font-medium text-foreground" : "text-muted-foreground"
              )}
            >
              <span className="relative flex">
                <HugeiconsIcon icon={item.icon} className="size-[22px]" />
                {item.href === "/low" && lowCount > 0 ? (
                  <Badge
                    variant="destructive"
                    // Solid, not the variant's 10% tint: a count on the nav has
                    // to read at a glance.
                    className="absolute -top-1.5 left-3 h-[17px] min-w-[17px] justify-center bg-destructive px-1 text-[10px] text-white"
                  >
                    {lowCount}
                  </Badge>
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={openAdd}
          className="flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground outline-none focus-visible:bg-muted"
        >
          <HugeiconsIcon icon={Add01Icon} className="size-[22px]" />
          Add
        </button>
      </nav>
    </div>
  );
}
