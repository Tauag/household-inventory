"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function LoadingRows({ withChips }: { withChips: boolean }) {
  return (
    <>
      {withChips ? (
        <div className="flex gap-2 px-4 py-3">
          <Skeleton className="h-11 w-14 rounded-full" />
          <Skeleton className="h-11 w-24 rounded-full" />
          <Skeleton className="h-11 w-20 rounded-full" />
        </div>
      ) : null}
      <ul>
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex items-center gap-3 border-b px-4 py-3">
            <div className="flex flex-1 flex-col gap-[7px]">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-3.5 w-44" />
              <Skeleton className="h-2.5 w-28" />
            </div>
            <Skeleton className="h-11 w-[132px] rounded-lg" />
          </li>
        ))}
      </ul>
    </>
  );
}
